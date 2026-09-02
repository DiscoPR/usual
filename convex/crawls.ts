import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { crawlPageStatus, matchSource } from "./schema";

export const listPages = query({
  args: { tripId: v.id("trips") },
  returns: v.array(
    v.object({
      _id: v.id("crawlPages"),
      url: v.string(),
      label: v.string(),
      status: crawlPageStatus,
      excerpt: v.union(v.string(), v.null()),
      skipReason: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const pages = await ctx.db
      .query("crawlPages")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .take(20);
    return pages.map((page) => ({
      _id: page._id,
      url: page.url,
      label: page.label,
      status: page.status,
      excerpt: page.markdown ? page.markdown.slice(0, 400) : null,
      skipReason: page.skipReason,
    }));
  },
});

export const getPage = internalQuery({
  args: { pageId: v.id("crawlPages") },
  returns: v.union(
    v.object({
      _id: v.id("crawlPages"),
      tripId: v.id("trips"),
      url: v.string(),
      label: v.string(),
      markdown: v.union(v.string(), v.null()),
      status: crawlPageStatus,
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) return null;
    return {
      _id: page._id,
      tripId: page.tripId,
      url: page.url,
      label: page.label,
      markdown: page.markdown,
      status: page.status,
    };
  },
});

export const addPage = internalMutation({
  args: {
    tripId: v.id("trips"),
    url: v.string(),
    label: v.string(),
    status: crawlPageStatus,
    markdown: v.union(v.string(), v.null()),
    skipReason: v.union(v.string(), v.null()),
  },
  returns: v.id("crawlPages"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("crawlPages", args);
  },
});

export const addCandidates = internalMutation({
  args: {
    tripId: v.id("trips"),
    crawlPageId: v.id("crawlPages"),
    candidates: v.array(
      v.object({
        name: v.string(),
        neighborhood: v.string(),
        categories: v.array(v.string()),
        snippet: v.string(),
        sourceUrl: v.string(),
      }),
    ),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    let added = 0;
    for (const candidate of args.candidates.slice(0, 40)) {
      const existing = await ctx.db
        .query("candidates")
        .withIndex("by_trip_name", (q) =>
          q.eq("tripId", args.tripId).eq("name", candidate.name),
        )
        .unique();
      if (existing) continue;
      await ctx.db.insert("candidates", {
        tripId: args.tripId,
        crawlPageId: args.crawlPageId,
        ...candidate,
      });
      added += 1;
    }
    return added;
  },
});

export const clearTripExtract = internalMutation({
  args: { tripId: v.id("trips") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const pages = await ctx.db
      .query("crawlPages")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .take(40);
    for (const page of pages) await ctx.db.delete(page._id);
    const candidates = await ctx.db
      .query("candidates")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .take(80);
    for (const row of candidates) await ctx.db.delete(row._id);
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .take(40);
    for (const row of matches) await ctx.db.delete(row._id);
    return null;
  },
});

export const listMatches = query({
  args: { tripId: v.id("trips") },
  returns: v.array(
    v.object({
      _id: v.id("matches"),
      name: v.string(),
      neighborhood: v.string(),
      homePlaceName: v.string(),
      score: v.number(),
      whyLine: v.string(),
      vibeTag: v.string(),
      quote: v.string(),
      source: matchSource,
      sourceUrl: v.union(v.string(), v.null()),
      grounded: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("matches")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .take(40);
    return rows
      .filter(
        (row) =>
          (row.source === "crawl" || row.source === "demo") &&
          (row.score ?? 0) >= 7 &&
          Boolean(row.whyLine) &&
          row.grounded,
      )
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 16)
      .map((row) => ({
        _id: row._id,
        name: row.name,
        neighborhood: row.neighborhood,
        homePlaceName: row.homePlaceName,
        score: row.score ?? 0,
        whyLine: row.whyLine ?? "",
        vibeTag: row.vibeTag ?? "",
        quote: row.quote ?? "",
        source: row.source,
        sourceUrl: row.sourceUrl,
        grounded: row.grounded,
      }));
  },
});

export const upsertMatch = internalMutation({
  args: {
    tripId: v.id("trips"),
    name: v.string(),
    neighborhood: v.string(),
    homePlaceName: v.string(),
    score: v.number(),
    whyLine: v.string(),
    vibeTag: v.string(),
    quote: v.string(),
    source: v.union(v.literal("crawl"), v.literal("demo")),
    sourceUrl: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    if (args.score < 7) return false;
    const existing = await ctx.db
      .query("matches")
      .withIndex("by_trip_name", (q) =>
        q.eq("tripId", args.tripId).eq("name", args.name),
      )
      .unique();
    const doc = {
      tripId: args.tripId,
      name: args.name,
      neighborhood: args.neighborhood,
      homePlaceName: args.homePlaceName,
      score: args.score,
      whyLine: args.whyLine,
      vibeTag: args.vibeTag,
      quote: args.quote,
      source: args.source,
      sourceUrl: args.sourceUrl,
      grounded: true,
    };
    if (!existing) {
      await ctx.db.insert("matches", doc);
      return true;
    }
    if ((existing.score ?? 0) >= args.score) return false;
    await ctx.db.patch(existing._id, doc);
    return true;
  },
});
