import { FirecrawlClient } from "@firecrawl/firecrawl-convex";
import { v } from "convex/values";
import { api, components, internal } from "./_generated/api";
import { action } from "./_generated/server";
import { sourcesForCity } from "./sources";

const firecrawl = new FirecrawlClient(components.firecrawl);

export const refreshCity = action({
  args: { tripId: v.id("trips") },
  returns: v.object({
    crawled: v.number(),
    skipped: v.number(),
    missingKey: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const trip = await ctx.runQuery(api.trips.get, { tripId: args.tripId });
    if (!trip) throw new Error("Trip not found.");

    const firecrawlKey = process.env.FIRECRAWL_API_KEY ?? "";
    const hasKey = firecrawlKey.startsWith("fc-");
    if (!hasKey) {
      await ctx.runMutation(internal.trips.setCrawlState, {
        tripId: args.tripId,
        crawlStatus: "missing_key",
        status: trip.status,
        crawlError:
          "FIRECRAWL_API_KEY is not set. Demo excerpt stays. This is not a successful crawl.",
      });
      return { crawled: 0, skipped: 0, missingKey: true };
    }

    const sources = sourcesForCity(trip.city);
    if (sources.length === 0) {
      await ctx.runMutation(internal.trips.setCrawlState, {
        tripId: args.tripId,
        crawlStatus: "failed",
        status: "draft",
        crawlError: `No verified public sources on file for ${trip.city}. Austin and Lisbon are wired in this build.`,
      });
      return { crawled: 0, skipped: 0, missingKey: false };
    }

    await ctx.runMutation(internal.trips.setCrawlState, {
      tripId: args.tripId,
      crawlStatus: "crawling",
      status: "crawling",
      crawlError: null,
    });
    await ctx.runMutation(internal.crawls.clearPages, { tripId: args.tripId });

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
        crawled += 1;
        await ctx.runMutation(internal.crawls.addPage, {
          tripId: args.tripId,
          url: source.url,
          label: source.label,
          status: "ok",
          markdown: markdown.slice(0, 12_000),
          skipReason: null,
        });
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
      return { crawled, skipped, missingKey: false };
    }

    await ctx.runMutation(internal.trips.setCrawlState, {
      tripId: args.tripId,
      crawlStatus: "ready",
      status: "matching",
      crawlError: null,
    });
    await ctx.runAction(internal.match.fromCrawl, { tripId: args.tripId });
    return { crawled, skipped, missingKey: false };
  },
});
