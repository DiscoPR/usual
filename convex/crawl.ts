import { FirecrawlClient } from "@firecrawl/firecrawl-convex";
import { v } from "convex/values";
import { api, components, internal } from "./_generated/api";
import { action, type ActionCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  mergeSources,
  normalizeSourceUrl,
  sourcesForCity,
  type CitySource,
} from "./sources";
import {
  AUSTIN_DEMO_PAGES,
  SURF_MISS,
  SURF_MISS_CARD,
  demoWhy,
} from "./seedData";
import { extractCandidates } from "./taxonomy";
import {
  AUSTIN_EMAIL_INTAKE,
  intakeFromTrip,
  intakeWhyBit,
  searchQueriesForCity,
  type Intake,
} from "./intake";

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
      return {
        crawled: AUSTIN_DEMO_PAGES.length,
        skipped: 0,
        missingKey: false,
        demo: true,
      };
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

    await ctx.runMutation(internal.trips.setCrawlState, {
      tripId: args.tripId,
      crawlStatus: "crawling",
      status: "crawling",
      crawlError: null,
      matchNote: `Searching public lists for ${trip.city}.`,
    });
    await ctx.runMutation(internal.crawls.clearTripExtract, {
      tripId: args.tripId,
    });

    const intake = intakeFromTrip(trip);
    const discovered = await discoverListPages(ctx, trip.city, intake);
    const sources = mergeSources(discovered, sourcesForCity(trip.city)).slice(
      0,
      12,
    );
    if (sources.length === 0) {
      await ctx.runMutation(internal.trips.setCrawlState, {
        tripId: args.tripId,
        crawlStatus: "failed",
        status: "draft",
        crawlError: `No public lists found for ${trip.city}`,
      });
      return { crawled: 0, skipped: 0, missingKey: false, demo: false };
    }

    await ctx.runMutation(internal.trips.setCrawlState, {
      tripId: args.tripId,
      crawlStatus: "crawling",
      status: "crawling",
      crawlError: null,
      matchNote: `Crawling ${sources.length} public list page(s) for ${trip.city}.`,
    });
    let { crawled, skipped } = await scrapeSources(ctx, args.tripId, sources);
    let grounded = await ctx.runQuery(api.crawls.countGrounded, {
      tripId: args.tripId,
    });
    if (grounded < 15) {
      const extra = await discoverListPages(ctx, trip.city, intake, {
        already: sources.map((source) => source.url),
        extraPass: true,
      });
      const more = mergeSources(extra, []).filter(
        (source) => !sources.some((row) => row.url === source.url),
      );
      if (more.length > 0) {
        const second = await scrapeSources(ctx, args.tripId, more.slice(0, 6));
        crawled += second.crawled;
        skipped += second.skipped;
        grounded = await ctx.runQuery(api.crawls.countGrounded, {
          tripId: args.tripId,
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

    await ctx.runMutation(internal.trips.setCrawlState, {
      tripId: args.tripId,
      crawlStatus: "ready",
      status: "ready",
      crawlError: null,
      matchNote:
        grounded >= 15
          ? `Live crawl. ${grounded} grounded places from public lists, scored into Top / Middle / Maybe. No invented venues.`
          : `only ${grounded} grounded places in this crawl. Tiers show what the lists actually had. No invented venues.`,
    });
    await ctx.runMutation(api.trips.draftFromMatches, { tripId: args.tripId });
    return { crawled, skipped, missingKey: false, demo: false };
  },
});

async function scrapeSources(
  ctx: ActionCtx,
  tripId: Id<"trips">,
  sources: CitySource[],
): Promise<{ crawled: number; skipped: number }> {
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
          tripId,
          url: source.url,
          label: source.label,
          status: "skipped",
          markdown: null,
          skipReason: "Empty page, skipped.",
        });
        continue;
      }
      const pageId = await ctx.runMutation(internal.crawls.addPage, {
        tripId,
        url: source.url,
        label: source.label,
        status: "ok",
        markdown: markdown.slice(0, 12_000),
        skipReason: null,
      });
      crawled += 1;
      await ctx.runMutation(internal.trips.setCrawlState, {
        tripId,
        crawlStatus: "crawling",
        status: "matching",
        crawlError: null,
      });
      await ctx.runAction(internal.match.fromPage, { pageId });
    } catch (error) {
      skipped += 1;
      const message = error instanceof Error ? error.message : "Crawl failed.";
      const skipReason = /404|not found/i.test(message)
        ? "URL 404, skipped."
        : message.slice(0, 180);
      await ctx.runMutation(internal.crawls.addPage, {
        tripId,
        url: source.url,
        label: source.label,
        status: "skipped",
        markdown: null,
        skipReason,
      });
    }
  }

  return { crawled, skipped };
}

async function discoverListPages(
  ctx: ActionCtx,
  city: string,
  intake: Intake,
  opts?: { already?: string[]; extraPass?: boolean },
): Promise<CitySource[]> {
  const queries = searchQueriesForCity(city, intake);
  const found: CitySource[] = [];
  const seen = new Set<string>(opts?.already ?? []);
  const cap = opts?.extraPass ? 12 : 10;

  for (const query of queries) {
    if (found.length >= cap) break;
    try {
      const result = await firecrawl.search(ctx, query, {
        limit: 6,
        ignoreInvalidURLs: true,
        excludeDomains: [
          "google.com",
          "maps.google.com",
          "googleapis.com",
          "goo.gl",
        ],
      });
      for (const row of result.web ?? []) {
        const url = pickSearchUrl(row);
        if (!isAllowedListUrl(url)) continue;
        const clean = normalizeSourceUrl(url);
        if (clean.length === 0 || seen.has(clean)) continue;
        seen.add(clean);
        const title =
          typeof row.title === "string" && row.title.trim().length > 0
            ? row.title.trim().slice(0, 80)
            : labelFromUrl(clean);
        found.push({ url: clean, label: title });
        if (found.length >= cap) break;
      }
    } catch {
      // Try the next query. Empty search is not an invented list.
    }
  }

  return found
    .sort((a, b) => preferList(a.url) - preferList(b.url))
    .slice(0, cap);
}

function pickSearchUrl(row: { url?: unknown; [key: string]: unknown }): string {
  if (typeof row.url === "string") return row.url.trim();
  const metadata = row.metadata;
  if (metadata && typeof metadata === "object") {
    const sourceURL = (metadata as { sourceURL?: unknown }).sourceURL;
    if (typeof sourceURL === "string") return sourceURL.trim();
  }
  return "";
}

function isAllowedListUrl(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return false;
  const lower = url.toLowerCase();
  if (
    lower.includes("google.com/maps") ||
    lower.includes("maps.google") ||
    lower.includes("goo.gl/maps")
  ) {
    return false;
  }
  return true;
}

function preferList(url: string): number {
  const lower = url.toLowerCase();
  if (lower.includes("eater.com")) return 0;
  if (lower.includes("timeout.com")) return 1;
  if (lower.includes("visit") || lower.includes("tourism")) return 2;
  return 3;
}

function labelFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 60);
  }
}

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
        whyLine: `${demoWhy(match)} ${intakeWhyBit(AUSTIN_EMAIL_INTAKE)}`,
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
      "Labeled demo. Fifteen grounded places from public list pages, in three tiers. One explicit miss (no surf shop). Nothing invented.",
  });
  await ctx.runMutation(api.trips.draftFromMatches, { tripId });
}
