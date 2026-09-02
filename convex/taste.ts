import { v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { tasteSource } from "./schema";
import { inferAnchor, rollupProfile, type Anchor } from "./taxonomy";

const tasteDoc = v.object({
  _id: v.id("tastePlaces"),
  name: v.string(),
  city: v.string(),
  note: v.string(),
  url: v.union(v.string(), v.null()),
  categories: v.array(v.string()),
  vibeTags: v.array(v.string()),
  priceBand: v.union(v.string(), v.null()),
  descriptors: v.array(v.string()),
  source: tasteSource,
});

export const list = query({
  args: { profileId: v.id("profiles") },
  returns: v.array(tasteDoc),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("tastePlaces")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .take(12);
    return rows.map(toTasteDoc);
  },
});

export const listAnchors = query({
  args: { profileId: v.id("profiles") },
  returns: v.array(
    v.object({
      name: v.string(),
      city: v.string(),
      note: v.string(),
      url: v.union(v.string(), v.null()),
      categories: v.array(v.string()),
      vibeTags: v.array(v.string()),
      priceBand: v.union(v.string(), v.null()),
      descriptors: v.array(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("tastePlaces")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .take(12);
    return rows.map((row) => toAnchor(row));
  },
});

export const add = mutation({
  args: {
    profileId: v.id("profiles"),
    name: v.string(),
    city: v.string(),
    note: v.string(),
    url: v.optional(v.union(v.string(), v.null())),
    source: v.optional(v.union(v.literal("manual"), v.literal("csv"))),
  },
  returns: v.id("tastePlaces"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tastePlaces")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .take(12);
    if (existing.length >= 12) {
      throw new Error("Twelve usuals is enough. Remove one first.");
    }
    const name = args.name.trim();
    const city = args.city.trim();
    const note = args.note.trim() || "Because it is one of your usuals.";
    if (name.length === 0 || city.length === 0) {
      throw new Error("Name and city are required.");
    }
    const inferred = inferAnchor(name, note);
    const id = await ctx.db.insert("tastePlaces", {
      profileId: args.profileId,
      name,
      city,
      note,
      url: cleanUrl(args.url),
      categories: inferred.categories,
      vibeTags: inferred.vibeTags,
      priceBand: inferred.priceBand,
      descriptors: inferred.descriptors,
      source: args.source ?? "manual",
    });
    await rollup(ctx, args.profileId);
    return id;
  },
});

export const addMany = mutation({
  args: {
    profileId: v.id("profiles"),
    places: v.array(
      v.object({
        name: v.string(),
        city: v.string(),
        note: v.string(),
        url: v.optional(v.union(v.string(), v.null())),
      }),
    ),
    source: v.union(v.literal("manual"), v.literal("csv")),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tastePlaces")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .take(12);
    let inserted = 0;
    const room = Math.max(0, 12 - existing.length);
    for (const place of args.places.slice(0, room)) {
      const name = place.name.trim();
      const city = place.city.trim();
      if (name.length === 0 || city.length === 0) continue;
      const note = place.note.trim() || "Because it is one of your usuals.";
      const inferred = inferAnchor(name, note);
      await ctx.db.insert("tastePlaces", {
        profileId: args.profileId,
        name,
        city,
        note,
        url: cleanUrl(place.url),
        categories: inferred.categories,
        vibeTags: inferred.vibeTags,
        priceBand: inferred.priceBand,
        descriptors: inferred.descriptors,
        source: args.source,
      });
      inserted += 1;
    }
    await rollup(ctx, args.profileId);
    return inserted;
  },
});

export const remove = mutation({
  args: { placeId: v.id("tastePlaces") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const place = await ctx.db.get(args.placeId);
    if (!place) return null;
    await ctx.db.delete(args.placeId);
    await rollup(ctx, place.profileId);
    return null;
  },
});

export const applyEnrichment = internalMutation({
  args: {
    placeId: v.id("tastePlaces"),
    extraText: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const place = await ctx.db.get(args.placeId);
    if (!place) return null;
    const inferred = inferAnchor(place.name, place.note, args.extraText);
    await ctx.db.patch(args.placeId, {
      categories: inferred.categories,
      vibeTags: inferred.vibeTags,
      priceBand: inferred.priceBand,
      descriptors: inferred.descriptors,
    });
    await rollup(ctx, place.profileId);
    return null;
  },
});

export const rollupNow = internalMutation({
  args: { profileId: v.id("profiles") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await rollup(ctx, args.profileId);
    return null;
  },
});

function toTasteDoc(row: {
  _id: Id<"tastePlaces">;
  name: string;
  city: string;
  note: string;
  url?: string | null;
  categories?: string[];
  vibeTags?: string[];
  priceBand?: string | null;
  descriptors?: string[];
  source: "seed" | "manual" | "csv";
}) {
  const anchor = toAnchor(row);
  return {
    _id: row._id,
    ...anchor,
    source: row.source,
  };
}

function toAnchor(row: {
  name: string;
  city: string;
  note: string;
  url?: string | null;
  categories?: string[];
  vibeTags?: string[];
  priceBand?: string | null;
  descriptors?: string[];
}): Anchor {
  const inferred = inferAnchor(row.name, row.note);
  return {
    name: row.name,
    city: row.city,
    note: row.note,
    url: row.url ?? null,
    categories: row.categories ?? inferred.categories,
    vibeTags: row.vibeTags ?? inferred.vibeTags,
    priceBand: row.priceBand ?? inferred.priceBand,
    descriptors: row.descriptors ?? inferred.descriptors,
  };
}

async function rollup(ctx: MutationCtx, profileId: Id<"profiles">) {
  const rows = await ctx.db
    .query("tastePlaces")
    .withIndex("by_profile", (q) => q.eq("profileId", profileId))
    .take(12);
  const summary = rollupProfile(rows.map((row) => toAnchor(row)));
  await ctx.db.patch(profileId, summary);
}

function cleanUrl(url?: string | null): string | null {
  const value = url?.trim() ?? "";
  if (value.length === 0) return null;
  if (!/^https?:\/\//i.test(value)) return null;
  return value;
}
