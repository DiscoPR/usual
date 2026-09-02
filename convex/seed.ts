import { v } from "convex/values";
import { mutation, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  AUSTIN_DEMO_MATCHES,
  DEMO_SLUG,
  DEMO_TASTE,
  demoPagesForAustin,
  demoWhy,
} from "./seedData";
import { rollupProfile } from "./taxonomy";

export const ensureDemo = mutation({
  args: {},
  returns: v.object({
    profileId: v.id("profiles"),
    tripId: v.id("trips"),
    created: v.boolean(),
  }),
  handler: async (ctx) => {
    let created = false;
    let profile = await ctx.db
      .query("profiles")
      .withIndex("by_slug", (q) => q.eq("slug", DEMO_SLUG))
      .unique();

    if (!profile) {
      const profileId = await ctx.db.insert("profiles", {
        slug: DEMO_SLUG,
        displayName: "You",
        homeCity: "Fort Lauderdale",
        categories: [],
        vibeTags: [],
        priceBand: "$",
      });
      profile = await ctx.db.get(profileId);
      created = true;
    }
    if (!profile) throw new Error("Demo profile missing.");

    const taste = await ctx.db
      .query("tastePlaces")
      .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
      .take(12);
    if (taste.length === 0) {
      for (const place of DEMO_TASTE) {
        await ctx.db.insert("tastePlaces", {
          profileId: profile._id,
          name: place.name,
          city: place.city,
          note: place.note,
          url: place.url,
          categories: [...place.categories],
          vibeTags: [...place.vibeTags],
          priceBand: place.priceBand,
          descriptors: [...place.descriptors],
          source: "seed",
        });
      }
    } else {
      for (const row of taste) {
        const seed = DEMO_TASTE.find((place) => place.name === row.name);
        if (!seed || (row.categories && row.categories.length > 0)) continue;
        await ctx.db.patch(row._id, {
          url: seed.url,
          categories: [...seed.categories],
          vibeTags: [...seed.vibeTags],
          priceBand: seed.priceBand,
          descriptors: [...seed.descriptors],
        });
      }
    }

    const freshTaste = await ctx.db
      .query("tastePlaces")
      .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
      .take(12);
    await ctx.db.patch(
      profile._id,
      rollupProfile(
        freshTaste.map((place) => ({
          name: place.name,
          city: place.city,
          note: place.note,
          url: place.url ?? null,
          categories: place.categories ?? [],
          vibeTags: place.vibeTags ?? [],
          priceBand: place.priceBand ?? null,
          descriptors: place.descriptors ?? [],
        })),
      ),
    );

    const trips = await ctx.db
      .query("trips")
      .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
      .take(10);
    let tripId = trips[0]?._id;
    if (!tripId) {
      tripId = await ctx.db.insert("trips", {
        profileId: profile._id,
        city: "Austin",
        dateLabel: "this weekend",
        status: "ready",
        origin: "seed",
        crawlStatus: "demo",
        crawlError: null,
        emailDraft: demoEmailBody(),
        emailSubject: "Your usual, in Austin — this weekend",
        matchNote:
          "Demo matches, labeled. Same shape as a live run: anchor, score, why line, source. Not a live crawl.",
      });
      created = true;
    }

    await reconcileAustinDemo(ctx, tripId);
    return { profileId: profile._id, tripId, created };
  },
});

async function reconcileAustinDemo(ctx: MutationCtx, tripId: Id<"trips">) {
  const matches = await ctx.db
    .query("matches")
    .withIndex("by_trip", (q) => q.eq("tripId", tripId))
    .take(20);
  const alreadyShaped =
    matches.length === AUSTIN_DEMO_MATCHES.length &&
    matches.every((row) => Boolean(row.score && row.whyLine));
  if (!alreadyShaped) {
    for (const row of matches) {
      await ctx.db.delete(row._id);
    }
    for (const match of AUSTIN_DEMO_MATCHES) {
      const whyLine = demoWhy(match);
      await ctx.db.insert("matches", {
        tripId,
        name: match.name,
        neighborhood: match.neighborhood,
        homePlaceName: match.homePlaceName,
        score: match.score,
        whyLine,
        vibeTag: match.vibeTag,
        quote: match.quote,
        source: "demo",
        sourceUrl: match.sourceUrl,
        grounded: true,
      });
    }
  }

  const pages = await ctx.db
    .query("crawlPages")
    .withIndex("by_trip", (q) => q.eq("tripId", tripId))
    .take(10);
  if (pages.length === 0) {
    for (const page of demoPagesForAustin()) {
      await ctx.db.insert("crawlPages", {
        tripId,
        url: page.url,
        label: `${page.label} (demo excerpt)`,
        status: "ok",
        markdown: page.markdown,
        skipReason: null,
      });
    }
  }

  await ctx.db.patch(tripId, {
    crawlStatus: "demo",
    matchNote:
      "Demo matches, labeled. Same shape as a live run: anchor, score, why line, source. Not a live crawl.",
    emailDraft: demoEmailBody(),
    emailSubject: "Your usual, in Austin — this weekend",
  });
}

function demoEmailBody(): string {
  const lines = AUSTIN_DEMO_MATCHES.map((match) => {
    return `• ${match.name} (${match.score}) — ${demoWhy(match)}`;
  });
  return [
    "Austin, this weekend.",
    "",
    "Demo board — same match shape as a live crawl.",
    "",
    ...lines,
    "",
    "Usual does not send this until you tap Send.",
  ].join("\n");
}
