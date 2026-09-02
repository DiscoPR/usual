import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { crawlRunStatus, tripOrigin, tripStatus } from "./schema";
import { parseTripRequest } from "./sources";
import { AUSTIN_MATCH_ORDER } from "./seedData";

const tripSummary = v.object({
  _id: v.id("trips"),
  city: v.string(),
  dateLabel: v.string(),
  status: tripStatus,
  origin: tripOrigin,
  crawlStatus: crawlRunStatus,
  crawlError: v.union(v.string(), v.null()),
  matchCount: v.number(),
});

export const list = query({
  args: { profileId: v.id("profiles") },
  returns: v.array(tripSummary),
  handler: async (ctx, args) => {
    const trips = await ctx.db
      .query("trips")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .take(30);
    const summaries = [];
    for (const trip of trips) {
      const matches = await ctx.db
        .query("matches")
        .withIndex("by_trip", (q) => q.eq("tripId", trip._id))
        .take(20);
      summaries.push({
        _id: trip._id,
        city: trip.city,
        dateLabel: trip.dateLabel,
        status: trip.status,
        origin: trip.origin,
        crawlStatus: trip.crawlStatus,
        crawlError: trip.crawlError,
        matchCount: matches.length,
      });
    }
    return summaries;
  },
});

export const get = query({
  args: { tripId: v.id("trips") },
  returns: v.union(
    v.object({
      _id: v.id("trips"),
      profileId: v.id("profiles"),
      city: v.string(),
      dateLabel: v.string(),
      status: tripStatus,
      origin: tripOrigin,
      crawlStatus: crawlRunStatus,
      crawlError: v.union(v.string(), v.null()),
      emailDraft: v.union(v.string(), v.null()),
      emailSubject: v.union(v.string(), v.null()),
      matchNote: v.union(v.string(), v.null()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) return null;
    return {
      _id: trip._id,
      profileId: trip.profileId,
      city: trip.city,
      dateLabel: trip.dateLabel,
      status: trip.status,
      origin: trip.origin,
      crawlStatus: trip.crawlStatus,
      crawlError: trip.crawlError,
      emailDraft: trip.emailDraft,
      emailSubject: trip.emailSubject,
      matchNote: trip.matchNote,
    };
  },
});

export const create = mutation({
  args: {
    profileId: v.id("profiles"),
    city: v.string(),
    dateLabel: v.string(),
  },
  returns: v.id("trips"),
  handler: async (ctx, args) => {
    const city = args.city.trim();
    if (city.length === 0) throw new Error("City is required.");
    return await ctx.db.insert("trips", {
      profileId: args.profileId,
      city,
      dateLabel: args.dateLabel.trim() || "whenever you land",
      status: "draft",
      origin: "ui",
      crawlStatus: "idle",
      crawlError: null,
      emailDraft: null,
      emailSubject: null,
      matchNote: null,
    });
  },
});

export const createFromText = mutation({
  args: {
    profileId: v.id("profiles"),
    text: v.string(),
    origin: tripOrigin,
  },
  returns: v.union(v.id("trips"), v.null()),
  handler: async (ctx, args) => {
    const parsed = parseTripRequest(args.text);
    if (!parsed) return null;
    return await ctx.db.insert("trips", {
      profileId: args.profileId,
      city: parsed.city,
      dateLabel: parsed.dateLabel,
      status: "draft",
      origin: args.origin,
      crawlStatus: "idle",
      crawlError: null,
      emailDraft: null,
      emailSubject: null,
      matchNote: null,
    });
  },
});

export const draftFromMatches = mutation({
  args: { tripId: v.id("trips") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found.");
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .take(12);
    const hits = matches
      .filter(
        (match) =>
          !match.isMiss && (match.score ?? 0) >= 7 && match.whyLine,
      )
      .sort((a, b) => {
        const ai = AUSTIN_MATCH_ORDER.indexOf(
          a.name as (typeof AUSTIN_MATCH_ORDER)[number],
        );
        const bi = AUSTIN_MATCH_ORDER.indexOf(
          b.name as (typeof AUSTIN_MATCH_ORDER)[number],
        );
        if (ai !== -1 || bi !== -1) {
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        }
        return (b.score ?? 0) - (a.score ?? 0);
      });
    const misses = matches.filter((match) => match.isMiss);
    const austin = trip.city.trim().toLowerCase() === "austin";
    const subject = austin
      ? "Your usual, in Austin"
      : `Your usual, in ${trip.city}`;
    const lines = hits.map((match) => {
      const place =
        match.neighborhood && match.neighborhood !== "unknown"
          ? `${match.name} (${match.neighborhood})`
          : match.name;
      return `• ${place} — ${match.whyLine}`;
    });
    const missLines = misses.map(
      (match) => `${match.homePlaceName} — ${match.whyLine}`,
    );
    const body = [
      subject,
      "",
      ...lines,
      ...(missLines.length > 0 ? ["", ...missLines] : []),
      "",
      austin ? "No Sixth Street." : "Usual does not send this until you approve.",
    ].join("\n");
    await ctx.db.patch(args.tripId, {
      emailSubject: subject,
      emailDraft: body,
    });
    return null;
  },
});

export const saveDraft = mutation({
  args: {
    tripId: v.id("trips"),
    emailSubject: v.string(),
    emailDraft: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tripId, {
      emailSubject: args.emailSubject,
      emailDraft: args.emailDraft,
    });
    return null;
  },
});

export const markSent = internalMutation({
  args: { tripId: v.id("trips") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tripId, { status: "sent" });
    return null;
  },
});

export const setCrawlState = internalMutation({
  args: {
    tripId: v.id("trips"),
    crawlStatus: crawlRunStatus,
    status: v.optional(tripStatus),
    crawlError: v.union(v.string(), v.null()),
    matchNote: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tripId, {
      crawlStatus: args.crawlStatus,
      crawlError: args.crawlError,
      ...(args.status ? { status: args.status } : {}),
      ...(args.matchNote !== undefined ? { matchNote: args.matchNote } : {}),
    });
    return null;
  },
});
