import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { tasteSource } from "./schema";

const tasteDoc = v.object({
  _id: v.id("tastePlaces"),
  name: v.string(),
  city: v.string(),
  note: v.string(),
  source: tasteSource,
});

export const list = query({
  args: { profileId: v.id("profiles") },
  returns: v.array(tasteDoc),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("tastePlaces")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .take(40);
    return rows.map((row) => ({
      _id: row._id,
      name: row.name,
      city: row.city,
      note: row.note,
      source: row.source,
    }));
  },
});

export const add = mutation({
  args: {
    profileId: v.id("profiles"),
    name: v.string(),
    city: v.string(),
    note: v.string(),
    source: v.optional(v.union(v.literal("manual"), v.literal("csv"))),
  },
  returns: v.id("tastePlaces"),
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const city = args.city.trim();
    const note = args.note.trim();
    if (name.length === 0 || city.length === 0) {
      throw new Error("Name and city are required.");
    }
    return await ctx.db.insert("tastePlaces", {
      profileId: args.profileId,
      name,
      city,
      note: note.length > 0 ? note : "Because it is one of your usuals.",
      source: args.source ?? "manual",
    });
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
      }),
    ),
    source: v.union(v.literal("manual"), v.literal("csv")),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    let inserted = 0;
    for (const place of args.places.slice(0, 30)) {
      const name = place.name.trim();
      const city = place.city.trim();
      if (name.length === 0 || city.length === 0) continue;
      await ctx.db.insert("tastePlaces", {
        profileId: args.profileId,
        name,
        city,
        note:
          place.note.trim().length > 0
            ? place.note.trim()
            : "Because it is one of your usuals.",
        source: args.source,
      });
      inserted += 1;
    }
    return inserted;
  },
});

export const remove = mutation({
  args: { placeId: v.id("tastePlaces") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.placeId);
    return null;
  },
});
