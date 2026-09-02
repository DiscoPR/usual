import { v } from "convex/values";
import { query } from "./_generated/server";
import { DEMO_SLUG } from "./seedData";

export const getDemo = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("profiles"),
      slug: v.string(),
      displayName: v.string(),
      homeCity: v.string(),
      categories: v.array(v.string()),
      vibeTags: v.array(v.string()),
      priceBand: v.union(v.string(), v.null()),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_slug", (q) => q.eq("slug", DEMO_SLUG))
      .unique();
    if (!profile) return null;
    return {
      _id: profile._id,
      slug: profile.slug,
      displayName: profile.displayName,
      homeCity: profile.homeCity,
      categories: profile.categories ?? [],
      vibeTags: profile.vibeTags ?? [],
      priceBand: profile.priceBand ?? null,
    };
  },
});

export const integrationStatus = query({
  args: {},
  returns: v.object({
    firecrawl: v.boolean(),
    agentmail: v.boolean(),
    openai: v.boolean(),
  }),
  handler: async () => {
    const firecrawlKey = process.env.FIRECRAWL_API_KEY ?? "";
    return {
      firecrawl: firecrawlKey.startsWith("fc-"),
      agentmail: Boolean(process.env.AGENTMAIL_API_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY),
    };
  },
});
