import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import {
  intakeFromTrip,
  occasionLabel,
  partyLabel,
  tierFromScore,
} from "./intake";
import { AUSTIN_MATCH_ORDER } from "./seedData";
import { isAustinCity } from "./sources";

export async function writeDraftFromMatches(
  ctx: MutationCtx,
  tripId: Id<"trips">,
): Promise<boolean> {
  const trip = await ctx.db.get(tripId);
  if (!trip) return false;
  const matches = await ctx.db
    .query("matches")
    .withIndex("by_trip", (q) => q.eq("tripId", tripId))
    .take(80);
  const hits = matches
    .filter(
      (match) => !match.isMiss && (match.score ?? 0) >= 3 && match.whyLine,
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
  if (hits.length === 0 && misses.length === 0) return false;
  const austin = isAustinCity(trip.city);
  const intake = intakeFromTrip(trip);
  const subject = austin
    ? "Your usual, in Austin"
    : `Your usual, in ${trip.city}`;
  const byTier = {
    top: hits
      .filter((match) => tierFromScore(match.score ?? 0) === "top")
      .slice(0, 5),
    middle: hits
      .filter((match) => tierFromScore(match.score ?? 0) === "middle")
      .slice(0, 5),
    maybe: hits
      .filter((match) => tierFromScore(match.score ?? 0) === "maybe")
      .slice(0, 5),
  };
  const lineFor = (match: (typeof hits)[number]) => {
    const place =
      match.neighborhood && match.neighborhood !== "unknown"
        ? `${match.name} (${match.neighborhood})`
        : match.name;
    return `• ${place}. ${match.whyLine}`;
  };
  const lines = [
    `For ${partyLabel(intake)}, ${occasionLabel(intake)}.`,
    "",
    "Top 5",
    ...byTier.top.map(lineFor),
    "",
    "Middle 5",
    ...byTier.middle.map(lineFor),
    "",
    "Maybe",
    ...byTier.maybe.map(lineFor),
  ];
  const missLines = misses.map(
    (match) => `${match.homePlaceName}. ${match.whyLine}`,
  );
  const body = [
    subject,
    "",
    ...lines,
    ...(missLines.length > 0 ? ["", ...missLines] : []),
    "",
    austin ? "No Sixth Street." : "Usual does not send this until you approve.",
  ].join("\n");
  await ctx.db.patch(tripId, {
    emailSubject: subject,
    emailDraft: body,
  });
  return true;
}
