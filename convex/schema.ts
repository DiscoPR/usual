import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const tasteSource = v.union(
  v.literal("seed"),
  v.literal("manual"),
  v.literal("csv"),
);

export const tripStatus = v.union(
  v.literal("draft"),
  v.literal("crawling"),
  v.literal("matching"),
  v.literal("ready"),
  v.literal("sent"),
);

export const tripOrigin = v.union(
  v.literal("ui"),
  v.literal("email"),
  v.literal("seed"),
);

export const crawlPageStatus = v.union(
  v.literal("ok"),
  v.literal("skipped"),
  v.literal("failed"),
);

export const crawlRunStatus = v.union(
  v.literal("idle"),
  v.literal("crawling"),
  v.literal("ready"),
  v.literal("missing_key"),
  v.literal("failed"),
  v.literal("demo"),
);

export const matchSource = v.union(
  v.literal("crawl"),
  v.literal("demo"),
  v.literal("model_guess"),
  v.literal("placeholder"),
);

export const messageDirection = v.union(
  v.literal("inbound"),
  v.literal("outbound"),
  v.literal("draft"),
);

export const messageStatus = v.union(
  v.literal("received"),
  v.literal("draft"),
  v.literal("sent"),
  v.literal("simulated"),
  v.literal("blocked"),
);

export default defineSchema({
  profiles: defineTable({
    slug: v.string(),
    displayName: v.string(),
    homeCity: v.string(),
    categories: v.optional(v.array(v.string())),
    vibeTags: v.optional(v.array(v.string())),
    priceBand: v.optional(v.union(v.string(), v.null())),
  }).index("by_slug", ["slug"]),

  tastePlaces: defineTable({
    profileId: v.id("profiles"),
    name: v.string(),
    city: v.string(),
    note: v.string(),
    url: v.optional(v.union(v.string(), v.null())),
    categories: v.optional(v.array(v.string())),
    vibeTags: v.optional(v.array(v.string())),
    priceBand: v.optional(v.union(v.string(), v.null())),
    descriptors: v.optional(v.array(v.string())),
    source: tasteSource,
  }).index("by_profile", ["profileId"]),

  trips: defineTable({
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
  })
    .index("by_profile", ["profileId"])
    .index("by_profile_city", ["profileId", "city"]),

  crawlPages: defineTable({
    tripId: v.id("trips"),
    url: v.string(),
    label: v.string(),
    status: crawlPageStatus,
    markdown: v.union(v.string(), v.null()),
    skipReason: v.union(v.string(), v.null()),
  }).index("by_trip", ["tripId"]),

  candidates: defineTable({
    tripId: v.id("trips"),
    crawlPageId: v.id("crawlPages"),
    name: v.string(),
    neighborhood: v.string(),
    categories: v.array(v.string()),
    snippet: v.string(),
    sourceUrl: v.string(),
  })
    .index("by_trip", ["tripId"])
    .index("by_trip_name", ["tripId", "name"]),

  matches: defineTable({
    tripId: v.id("trips"),
    name: v.string(),
    neighborhood: v.string(),
    homePlaceName: v.string(),
    score: v.optional(v.number()),
    whyLine: v.optional(v.string()),
    vibeTag: v.optional(v.string()),
    quote: v.optional(v.string()),
    whyMirrors: v.optional(v.string()),
    goIfLine: v.optional(v.string()),
    source: matchSource,
    sourceUrl: v.union(v.string(), v.null()),
    grounded: v.boolean(),
  })
    .index("by_trip", ["tripId"])
    .index("by_trip_name", ["tripId", "name"]),

  messages: defineTable({
    tripId: v.union(v.id("trips"), v.null()),
    direction: messageDirection,
    status: messageStatus,
    subject: v.string(),
    body: v.string(),
    fromLabel: v.string(),
  }).index("by_trip", ["tripId"]),
});
