import { v } from "convex/values";
import { mutation } from "./_generated/server";
import {
  AUSTIN_DEMO_MATCHES,
  DEMO_SLUG,
  DEMO_TASTE,
  demoPagesForAustin,
} from "./seedData";

export const ensureDemo = mutation({
  args: {},
  returns: v.object({
    profileId: v.id("profiles"),
    tripId: v.id("trips"),
    created: v.boolean(),
  }),
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_slug", (q) => q.eq("slug", DEMO_SLUG))
      .unique();
    if (existing) {
      const trip = await ctx.db
        .query("trips")
        .withIndex("by_profile", (q) => q.eq("profileId", existing._id))
        .take(1);
      if (trip[0]) {
        return {
          profileId: existing._id,
          tripId: trip[0]._id,
          created: false,
        };
      }
    }

    const profileId =
      existing?._id ??
      (await ctx.db.insert("profiles", {
        slug: DEMO_SLUG,
        displayName: "You",
        homeCity: "Fort Lauderdale",
      }));

    const existingTaste = await ctx.db
      .query("tastePlaces")
      .withIndex("by_profile", (q) => q.eq("profileId", profileId))
      .take(1);
    if (existingTaste.length === 0) {
      for (const place of DEMO_TASTE) {
        await ctx.db.insert("tastePlaces", {
          profileId,
          name: place.name,
          city: place.city,
          note: place.note,
          source: "seed",
        });
      }
    }

    const tripId = await ctx.db.insert("trips", {
      profileId,
      city: "Austin",
      dateLabel: "this weekend",
      status: "ready",
      origin: "seed",
      crawlStatus: "demo",
      crawlError: null,
      emailDraft: demoEmailBody(),
      emailSubject: "Your usual, in Austin — this weekend",
      matchNote:
        "Demo matches, labeled. Grounded in public Eater Austin / Visit Austin pages. Not a live crawl or a live model response.",
    });

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

    for (const match of AUSTIN_DEMO_MATCHES) {
      await ctx.db.insert("matches", {
        tripId,
        name: match.name,
        neighborhood: match.neighborhood,
        homePlaceName: match.homePlaceName,
        whyMirrors: match.whyMirrors,
        goIfLine: match.goIfLine,
        source: "demo",
        sourceUrl: match.sourceUrl,
        grounded: true,
      });
    }

    return { profileId, tripId, created: true };
  },
});

function demoEmailBody(): string {
  const lines = AUSTIN_DEMO_MATCHES.map(
    (match) => `• ${match.name} (${match.neighborhood}) — ${match.goIfLine}`,
  );
  return [
    "Austin, this weekend.",
    "",
    "Your usual, mapped onto public lists — demo board, not a live crawl.",
    "",
    ...lines,
    "",
    "Usual does not send this until you tap Send.",
  ].join("\n");
}
