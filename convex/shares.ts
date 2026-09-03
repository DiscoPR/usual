import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { profileId: v.id("profiles") },
  returns: v.array(
    v.object({
      _id: v.id("shares"),
      kind: v.union(v.literal("usuals"), v.literal("trip")),
      toLabel: v.string(),
      subject: v.string(),
      body: v.string(),
      tripId: v.union(v.id("trips"), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("shares")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .take(30);
    return rows
      .slice()
      .reverse()
      .map((row) => ({
        _id: row._id,
        kind: row.kind,
        toLabel: row.toLabel,
        subject: row.subject,
        body: row.body,
        tripId: row.tripId,
      }));
  },
});

export const queue = mutation({
  args: {
    profileId: v.id("profiles"),
    kind: v.union(v.literal("usuals"), v.literal("trip")),
    toLabel: v.string(),
    subject: v.string(),
    body: v.string(),
    tripId: v.optional(v.union(v.id("trips"), v.null())),
  },
  returns: v.id("shares"),
  handler: async (ctx, args) => {
    const toLabel = args.toLabel.trim() || "a friend";
    const body = args.body.trim();
    if (body.length === 0) {
      throw new Error("Nothing to transfer. Copy or draft a list first.");
    }
    return await ctx.db.insert("shares", {
      profileId: args.profileId,
      kind: args.kind,
      toLabel,
      subject: args.subject.trim() || "Usual list",
      body,
      tripId: args.tripId ?? null,
    });
  },
});
