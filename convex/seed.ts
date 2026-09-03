import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import { rollupProfile } from "./taxonomy";
import {
  DEMO_SLUG,
  DEMO_TASTE,
  EXPECTED_TASTE_NAMES,
  INBOUND_BODY,
  INBOUND_SUBJECT,
} from "./seedData";

export const wipe = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "profiles",
      "tastePlaces",
      "trips",
      "crawlPages",
      "candidates",
      "matches",
      "shares",
      "messages",
    ] as const;
    for (const table of tables) {
      for (const row of await ctx.db.query(table).collect()) {
        await ctx.db.delete(row._id);
      }
    }
  },
});

export const insertHome = internalMutation({
  args: {},
  handler: async (ctx) => {
    const summary = rollupProfile(
      DEMO_TASTE.map((spot) => ({
        name: spot.name,
        city: spot.city,
        note: spot.note,
        url: spot.url,
        categories: [...spot.categories],
        vibeTags: [...spot.vibeTags],
        priceBand: spot.priceBand,
        descriptors: [...spot.descriptors],
      })),
    );
    const profileId = await ctx.db.insert("profiles", {
      slug: DEMO_SLUG,
      displayName: "Usual",
      homeCity: "Fort Lauderdale",
      ...summary,
    });
    for (const spot of DEMO_TASTE) {
      await ctx.db.insert("tastePlaces", {
        profileId,
        name: spot.name,
        city: spot.city,
        note: spot.note,
        url: spot.url,
        categories: [...spot.categories],
        vibeTags: [...spot.vibeTags],
        priceBand: spot.priceBand,
        descriptors: [...spot.descriptors],
        source: "seed",
      });
    }
    return { profileId };
  },
});

export const insertPendingInbound = internalMutation({
  args: { force: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("messages").collect();
    const sameSubject = existing.find(
      (row) =>
        row.direction === "inbound" && row.subject === INBOUND_SUBJECT,
    );
    if (sameSubject && !args.force) return { messageId: sameSubject._id };

    if (sameSubject && args.force) {
      await ctx.db.delete(sameSubject._id);
    }

    const messageId = await ctx.db.insert("messages", {
      tripId: null,
      direction: "inbound",
      fromLabel: "a friend",
      subject: INBOUND_SUBJECT,
      body: INBOUND_BODY,
      status: "pending",
    });
    return { messageId };
  },
});

export const ensureDemo = mutation({
  args: {},
  returns: v.id("profiles"),
  handler: async (ctx) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_slug", (q) => q.eq("slug", DEMO_SLUG))
      .unique();
    if (profile) {
      const places = await ctx.db
        .query("tastePlaces")
        .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
        .take(12);
      const names = places.map((place) => place.name);
      const matchesSeed =
        names.length === EXPECTED_TASTE_NAMES.length &&
        EXPECTED_TASTE_NAMES.every((name) => names.includes(name));
      if (matchesSeed) {
        const pending = await ctx.db
          .query("messages")
          .withIndex("by_status", (q) => q.eq("status", "pending"))
          .take(5);
        const hasInbox = pending.some(
          (row) => row.subject === INBOUND_SUBJECT,
        );
        if (!hasInbox) {
          const anyInbound = (await ctx.db.query("messages").collect()).some(
            (row) => row.subject === INBOUND_SUBJECT,
          );
          if (!anyInbound) {
            await ctx.db.insert("messages", {
              tripId: null,
              direction: "inbound",
              fromLabel: "a friend",
              subject: INBOUND_SUBJECT,
              body: INBOUND_BODY,
              status: "pending",
            });
          }
        }
        return profile._id;
      }
    }

    const tables = [
      "profiles",
      "tastePlaces",
      "trips",
      "crawlPages",
      "candidates",
      "matches",
      "shares",
      "messages",
    ] as const;
    for (const table of tables) {
      for (const row of await ctx.db.query(table).collect()) {
        await ctx.db.delete(row._id);
      }
    }

    const summary = rollupProfile(
      DEMO_TASTE.map((spot) => ({
        name: spot.name,
        city: spot.city,
        note: spot.note,
        url: spot.url,
        categories: [...spot.categories],
        vibeTags: [...spot.vibeTags],
        priceBand: spot.priceBand,
        descriptors: [...spot.descriptors],
      })),
    );
    const profileId = await ctx.db.insert("profiles", {
      slug: DEMO_SLUG,
      displayName: "Usual",
      homeCity: "Fort Lauderdale",
      ...summary,
    });
    for (const spot of DEMO_TASTE) {
      await ctx.db.insert("tastePlaces", {
        profileId,
        name: spot.name,
        city: spot.city,
        note: spot.note,
        url: spot.url,
        categories: [...spot.categories],
        vibeTags: [...spot.vibeTags],
        priceBand: spot.priceBand,
        descriptors: [...spot.descriptors],
        source: "seed",
      });
    }
    await ctx.db.insert("messages", {
      tripId: null,
      direction: "inbound",
      fromLabel: "a friend",
      subject: INBOUND_SUBJECT,
      body: INBOUND_BODY,
      status: "pending",
    });
    return profileId;
  },
});

export const resetDemo = mutation({
  args: {},
  returns: v.id("profiles"),
  handler: async (ctx) => {
    const tables = [
      "profiles",
      "tastePlaces",
      "trips",
      "crawlPages",
      "candidates",
      "matches",
      "shares",
      "messages",
    ] as const;
    for (const table of tables) {
      for (const row of await ctx.db.query(table).collect()) {
        await ctx.db.delete(row._id);
      }
    }
    const summary = rollupProfile(
      DEMO_TASTE.map((spot) => ({
        name: spot.name,
        city: spot.city,
        note: spot.note,
        url: spot.url,
        categories: [...spot.categories],
        vibeTags: [...spot.vibeTags],
        priceBand: spot.priceBand,
        descriptors: [...spot.descriptors],
      })),
    );
    const profileId = await ctx.db.insert("profiles", {
      slug: DEMO_SLUG,
      displayName: "Usual",
      homeCity: "Fort Lauderdale",
      ...summary,
    });
    for (const spot of DEMO_TASTE) {
      await ctx.db.insert("tastePlaces", {
        profileId,
        name: spot.name,
        city: spot.city,
        note: spot.note,
        url: spot.url,
        categories: [...spot.categories],
        vibeTags: [...spot.vibeTags],
        priceBand: spot.priceBand,
        descriptors: [...spot.descriptors],
        source: "seed",
      });
    }
    await ctx.db.insert("messages", {
      tripId: null,
      direction: "inbound",
      fromLabel: "a friend",
      subject: INBOUND_SUBJECT,
      body: INBOUND_BODY,
      status: "pending",
    });
    return profileId;
  },
});
