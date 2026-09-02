import { FirecrawlClient } from "@firecrawl/firecrawl-convex";
import { v } from "convex/values";
import { api, components, internal } from "./_generated/api";
import { action, type ActionCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { sourcesForCity } from "./sources";
import {
  AUSTIN_DEMO_PAGES,
  SURF_MISS,
  SURF_MISS_CARD,
  demoWhy,
} from "./seedData";
import { extractCandidates } from "./taxonomy";

const firecrawl = new FirecrawlClient(components.firecrawl);

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const refreshCity = action({
  args: { tripId: v.id("trips") },
  returns: v.object({
    crawled: v.number(),
    skipped: v.number(),
    missingKey: v.boolean(),
    demo: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const trip = await ctx.runQuery(api.trips.get, { tripId: args.tripId });
    if (!trip) throw new Error("Trip not found.");

    const firecrawlKey = process.env.FIRECRAWL_API_KEY ?? "";
    const hasKey = firecrawlKey.startsWith("fc-");
    const austin = trip.city.trim().toLowerCase().includes("austin");

    if (!hasKey && austin) {
      await runDemoCrawl(ctx, args.tripId);
      return { crawled: AUSTIN_DEMO_PAGES.length, skipped: 0, missingKey: false, demo: true };
    }

    if (!hasKey) {
      await ctx.runMutation(internal.trips.setCrawlState, {
        tripId: args.tripId,
        crawlStatus: "missing_key",
        status: trip.status,
        crawlError:
          "FIRECRAWL_API_KEY is not set. No labeled demo for this city.",
      });
      return { crawled: 0, skipped: 0, missingKey: true, demo: false };
    }

    const sources = sourcesForCity(trip.city);
    if (sources.length === 0) {
      await ctx.runMutation(internal.trips.setCrawlState, {
        tripId: args.tripId,
        crawlStatus: "failed",
        status: "draft",
        crawlError: `No verified public sources on file for ${trip.city}. Austin and Lisbon are wired in this build.`,
      });
      return { crawled: 0, skipped: 0, missingKey: false, demo: false };
    }

    await ctx.runMutation(internal.trips.setCrawlState, {
      tripId: args.tripId,
      crawlStatus: "crawling",
      status: "crawling",
      crawlError: null,
    });
    await ctx.runMutation(internal.crawls.clearTripExtract, {
      tripId: args.tripId,
    });

    let crawled = 0;
    let skipped = 0;

    for (const source of sources) {
      try {
        const page = await firecrawl.scrape(ctx, source.url, {
          formats: ["markdown"],
          onlyMainContent: true,
        });
        const markdown = page.markdown?.trim() ?? "";
        if (markdown.length === 0) {
          skipped += 1;
          await ctx.runMutation(internal.crawls.addPage, {
            tripId: args.tripId,
            url: source.url,
            label: source.label,
            status: "skipped",
            markdown: null,
            skipReason: "Empty page, skipped.",
          });
          continue;
        }
        const pageId = await ctx.runMutation(internal.crawls.addPage, {
          tripId: args.tripId,
          url: source.url,
          label: source.label,
          status: "ok",
          markdown: markdown.slice(0, 12_000),
          skipReason: null,
        });
        crawled += 1;
        await ctx.runMutation(internal.trips.setCrawlState, {
          tripId: args.tripId,
          crawlStatus: "crawling",
          status: "matching",
          crawlError: null,
        });
        await ctx.runAction(internal.match.fromPage, { pageId });
      } catch (error) {
        skipped += 1;
        const message =
          error instanceof Error ? error.message : "Crawl failed.";
        const skipReason = /404|not found/i.test(message)
          ? "URL 404, skipped."
          : message.slice(0, 180);
        await ctx.runMutation(internal.crawls.addPage, {
          tripId: args.tripId,
          url: source.url,
          label: source.label,
          status: "skipped",
          markdown: null,
          skipReason,
        });
      }
    }

    if (crawled === 0) {
      await ctx.runMutation(internal.trips.setCrawlState, {
        tripId: args.tripId,
        crawlStatus: "failed",
        status: "draft",
        crawlError: "Every source was skipped or failed. No fake success.",
      });
      return { crawled, skipped, missingKey: false, demo: false };
    }

    if (austin) {
      await ctx.runMutation(internal.crawls.upsertMatch, {
        tripId: args.tripId,
        name: SURF_MISS_CARD.name,
        neighborhood: SURF_MISS_CARD.neighborhood,
        homePlaceName: SURF_MISS_CARD.homePlaceName,
        score: 0,
        whyLine: SURF_MISS,
        vibeTag: SURF_MISS_CARD.vibeTag,
        quote: SURF_MISS,
        source: "demo",
        sourceUrl: null,
        isMiss: true,
      });
    }

    await ctx.runMutation(internal.trips.setCrawlState, {
      tripId: args.tripId,
      crawlStatus: "ready",
      status: "ready",
      crawlError: null,
      matchNote:
        "Live crawl. Candidates came from page text. Scores hide below 7. No invented venues.",
    });
    await ctx.runMutation(api.trips.draftFromMatches, { tripId: args.tripId });
    return { crawled, skipped, missingKey: false, demo: false };
  },
});

async function runDemoCrawl(ctx: ActionCtx, tripId: Id<"trips">) {
  await ctx.runMutation(internal.trips.setCrawlState, {
    tripId,
    crawlStatus: "demo",
    status: "crawling",
    crawlError: null,
    matchNote: "Labeled demo crawl. Matches land as each page finishes.",
  });
  await ctx.runMutation(internal.crawls.clearTripExtract, { tripId });

  for (const [index, page] of AUSTIN_DEMO_PAGES.entries()) {
    await delay(index === 0 ? 450 : 1100);
    const pageId = (await ctx.runMutation(internal.crawls.addPage, {
      tripId,
      url: page.url,
      label: page.label,
      status: "ok",
      markdown: page.markdown,
      skipReason: null,
    })) as Id<"crawlPages">;

    const extracted = extractCandidates(page.markdown, page.url);
    if (extracted.length > 0) {
      await ctx.runMutation(internal.crawls.addCandidates, {
        tripId,
        crawlPageId: pageId,
        candidates: extracted,
      });
    }

    await ctx.runMutation(internal.trips.setCrawlState, {
      tripId,
      crawlStatus: "demo",
      status: "matching",
      crawlError: null,
      matchNote: `${page.label} · page ${index + 1} of ${AUSTIN_DEMO_PAGES.length}`,
    });

    for (const match of page.matches) {
      await ctx.runMutation(internal.crawls.upsertMatch, {
        tripId,
        name: match.name,
        neighborhood: match.neighborhood,
        homePlaceName: match.homePlaceName,
        score: match.score,
        whyLine: demoWhy(match),
        vibeTag: match.vibeTag,
        quote: match.quote,
        source: "demo",
        sourceUrl: match.sourceUrl,
      });
    }
  }

  await delay(900);
  await ctx.runMutation(internal.crawls.upsertMatch, {
    tripId,
    name: SURF_MISS_CARD.name,
    neighborhood: SURF_MISS_CARD.neighborhood,
    homePlaceName: SURF_MISS_CARD.homePlaceName,
    score: 0,
    whyLine: SURF_MISS,
    vibeTag: SURF_MISS_CARD.vibeTag,
    quote: SURF_MISS,
    source: "demo",
    sourceUrl: null,
    isMiss: true,
  });

  await ctx.runMutation(internal.trips.setCrawlState, {
    tripId,
    crawlStatus: "demo",
    status: "ready",
    crawlError: null,
    matchNote:
      "Labeled demo. Four grounded matches from the crawl pages. One explicit miss. Nothing invented.",
  });
  await ctx.runMutation(api.trips.draftFromMatches, { tripId });
}
