import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
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

export const listMarkdown = query({
  args: { tripId: v.id("trips") },
  returns: v.array(
    v.object({
      url: v.string(),
      label: v.string(),
      markdown: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const pages = await ctx.db
      .query("crawlPages")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .take(20);
    return pages
      .filter((page) => page.status === "ok" && page.markdown)
      .map((page) => ({
        url: page.url,
        label: page.label,
        markdown: page.markdown ?? "",
      }));
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

export const clearPages = internalMutation({
  args: { tripId: v.id("trips") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const pages = await ctx.db
      .query("crawlPages")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .take(40);
    for (const page of pages) {
      await ctx.db.delete(page._id);
    }
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
      whyMirrors: v.string(),
      goIfLine: v.string(),
      source: matchSource,
      sourceUrl: v.union(v.string(), v.null()),
      grounded: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("matches")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .take(20);
    return rows.map((row) => ({
      _id: row._id,
      name: row.name,
      neighborhood: row.neighborhood,
      homePlaceName: row.homePlaceName,
      whyMirrors: row.whyMirrors,
      goIfLine: row.goIfLine,
      source: row.source,
      sourceUrl: row.sourceUrl,
      grounded: row.grounded,
    }));
  },
});

export const replaceMatches = internalMutation({
  args: {
    tripId: v.id("trips"),
    matches: v.array(
      v.object({
        name: v.string(),
        neighborhood: v.string(),
        homePlaceName: v.string(),
        whyMirrors: v.string(),
        goIfLine: v.string(),
        source: matchSource,
        sourceUrl: v.union(v.string(), v.null()),
        grounded: v.boolean(),
      }),
    ),
    matchNote: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("matches")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .take(40);
    for (const row of existing) {
      await ctx.db.delete(row._id);
    }
    for (const match of args.matches.slice(0, 12)) {
      await ctx.db.insert("matches", {
        tripId: args.tripId,
        ...match,
      });
    }
    await ctx.db.patch(args.tripId, {
      matchNote: args.matchNote,
      status: "ready",
      crawlStatus: args.matches.some((m) => m.source === "demo")
        ? "demo"
        : "ready",
    });
    return null;
  },
});
