import { FirecrawlClient } from "@firecrawl/firecrawl-convex";
import { v } from "convex/values";
import { api, components, internal } from "./_generated/api";
import { action } from "./_generated/server";

const firecrawl = new FirecrawlClient(components.firecrawl);

export const enrichPlace = action({
  args: { placeId: v.id("tastePlaces") },
  returns: v.object({
    enriched: v.boolean(),
    reason: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const profile = await ctx.runQuery(api.profile.getDemo);
    if (!profile) {
      return { enriched: false, reason: "No profile." };
    }
    const places = await ctx.runQuery(api.taste.list, {
      profileId: profile._id,
    });
    const place = places.find((row) => row._id === args.placeId);
    if (!place) return { enriched: false, reason: "Place not found." };
    if (!place.url) {
      return {
        enriched: false,
        reason: "No URL on this card. The why line already set the tags.",
      };
    }
    const key = process.env.FIRECRAWL_API_KEY ?? "";
    if (!key.startsWith("fc-")) {
      return {
        enriched: false,
        reason:
          "FIRECRAWL_API_KEY is not set. Card keeps the why-line tags. Not a successful crawl.",
      };
    }
    try {
      const page = await firecrawl.scrape(ctx, place.url, {
        formats: ["markdown"],
        onlyMainContent: true,
      });
      const markdown = page.markdown?.trim() ?? "";
      if (markdown.length === 0) {
        return { enriched: false, reason: "Empty page, skipped." };
      }
      await ctx.runMutation(internal.taste.applyEnrichment, {
        placeId: args.placeId,
        extraText: markdown.slice(0, 4000),
      });
      return { enriched: true, reason: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Crawl failed.";
      return {
        enriched: false,
        reason: /404|not found/i.test(message)
          ? "URL 404, skipped."
          : message.slice(0, 180),
      };
    }
  },
});
