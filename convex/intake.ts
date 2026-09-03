import { v } from "convex/values";
import type { Anchor, Candidate } from "./taxonomy";
import { categoryOverlap } from "./taxonomy";

export const PARTY_KINDS = [
  "solo",
  "couple",
  "friends",
  "family",
  "named_group",
] as const;

export const OCCASIONS = [
  "birthday",
  "wedding",
  "bachelorette",
  "bachelor",
  "none",
] as const;

export const GROUP_LIKES = [
  "drinkers",
  "hikers",
  "outdoors",
  "indoors",
  "food-first",
  "live-music",
  "coffee",
  "beach-water",
  "nightlife",
  "chill",
] as const;

export const WEATHER_WANTS = ["hot", "mild", "rain-ok", "ac-indoor"] as const;

export const TIERS = ["top", "middle", "maybe"] as const;

export type PartyKind = (typeof PARTY_KINDS)[number];
export type Occasion = (typeof OCCASIONS)[number];
export type GroupLike = (typeof GROUP_LIKES)[number];
export type WeatherWant = (typeof WEATHER_WANTS)[number];
export type Tier = (typeof TIERS)[number];

export type Intake = {
  partyKind: PartyKind;
  partyName: string;
  occasion: Occasion;
  groupLikes: GroupLike[];
  weatherWant: WeatherWant;
};

export const partyKindValidator = v.union(
  v.literal("solo"),
  v.literal("couple"),
  v.literal("friends"),
  v.literal("family"),
  v.literal("named_group"),
);

export const occasionValidator = v.union(
  v.literal("birthday"),
  v.literal("wedding"),
  v.literal("bachelorette"),
  v.literal("bachelor"),
  v.literal("none"),
);

export const groupLikeValidator = v.union(
  v.literal("drinkers"),
  v.literal("hikers"),
  v.literal("outdoors"),
  v.literal("indoors"),
  v.literal("food-first"),
  v.literal("live-music"),
  v.literal("coffee"),
  v.literal("beach-water"),
  v.literal("nightlife"),
  v.literal("chill"),
);

export const weatherWantValidator = v.union(
  v.literal("hot"),
  v.literal("mild"),
  v.literal("rain-ok"),
  v.literal("ac-indoor"),
);

export const intakeValidator = v.object({
  partyKind: partyKindValidator,
  partyName: v.string(),
  occasion: occasionValidator,
  groupLikes: v.array(groupLikeValidator),
  weatherWant: weatherWantValidator,
});

export const DEFAULT_INTAKE: Intake = {
  partyKind: "friends",
  partyName: "",
  occasion: "none",
  groupLikes: ["food-first", "coffee", "drinkers"],
  weatherWant: "mild",
};

export const AUSTIN_EMAIL_INTAKE: Intake = {
  partyKind: "friends",
  partyName: "",
  occasion: "none",
  groupLikes: ["food-first", "coffee", "drinkers", "live-music"],
  weatherWant: "mild",
};

export function normalizeIntake(raw?: Partial<Intake> | null): Intake {
  const likes = (raw?.groupLikes ?? DEFAULT_INTAKE.groupLikes).filter(
    (like): like is GroupLike =>
      (GROUP_LIKES as readonly string[]).includes(like),
  );
  return {
    partyKind: (PARTY_KINDS as readonly string[]).includes(raw?.partyKind ?? "")
      ? (raw?.partyKind as PartyKind)
      : DEFAULT_INTAKE.partyKind,
    partyName: (raw?.partyName ?? "").trim().slice(0, 60),
    occasion: (OCCASIONS as readonly string[]).includes(raw?.occasion ?? "")
      ? (raw?.occasion as Occasion)
      : DEFAULT_INTAKE.occasion,
    groupLikes: likes.length > 0 ? unique(likes) : [...DEFAULT_INTAKE.groupLikes],
    weatherWant: (WEATHER_WANTS as readonly string[]).includes(
      raw?.weatherWant ?? "",
    )
      ? (raw?.weatherWant as WeatherWant)
      : DEFAULT_INTAKE.weatherWant,
  };
}

export function tripIntakeFields(raw?: Partial<Intake> | null): Intake {
  return normalizeIntake(raw);
}

export function intakeFromTrip(trip: {
  partyKind?: string;
  partyName?: string;
  occasion?: string;
  groupLikes?: string[];
  weatherWant?: string;
}): Intake {
  return normalizeIntake({
    partyKind: trip.partyKind as PartyKind | undefined,
    partyName: trip.partyName,
    occasion: trip.occasion as Occasion | undefined,
    groupLikes: trip.groupLikes as GroupLike[] | undefined,
    weatherWant: trip.weatherWant as WeatherWant | undefined,
  });
}

export function partyLabel(intake: Intake): string {
  if (intake.partyKind === "named_group" && intake.partyName) {
    return intake.partyName;
  }
  if (intake.partyKind === "named_group") return "named group";
  return intake.partyKind;
}

export function occasionLabel(intake: Intake): string {
  if (intake.occasion === "none") return "just a trip";
  return intake.occasion;
}

export function eligibleCandidate(
  candidate: Candidate,
  anchors: Anchor[],
  intake: Intake,
): boolean {
  if (
    anchors.some((anchor) =>
      categoryOverlap(anchor.categories, candidate.categories),
    )
  ) {
    return true;
  }
  return intakeCategories(intake).some((category) =>
    candidate.categories.includes(category),
  );
}

export function applyIntakeBoost(
  score: number,
  candidate: Candidate,
  intake: Intake,
): number {
  let next = score;
  const cats = new Set(candidate.categories);
  const hay = `${candidate.snippet} ${candidate.categories.join(" ")}`.toLowerCase();
  const likes = new Set(intake.groupLikes);

  if (likes.has("drinkers") && (cats.has("bar") || cats.has("nightlife"))) {
    next += 2;
  }
  if (likes.has("nightlife") && (cats.has("nightlife") || cats.has("bar"))) {
    next += 1;
  }
  if (likes.has("live-music") && /live music|live-music|honky|stage/.test(hay)) {
    next += 2;
  }
  if (likes.has("coffee") && cats.has("coffee")) next += 1;
  if (
    likes.has("food-first") &&
    (cats.has("restaurant") || cats.has("diner") || cats.has("cuban"))
  ) {
    next += 1;
  }
  if (
    (likes.has("hikers") || likes.has("outdoors")) &&
    (cats.has("park") || cats.has("trail"))
  ) {
    next += 2;
  }
  if (likes.has("beach-water") && (cats.has("pool") || cats.has("shop"))) {
    next += 2;
  }
  if (likes.has("indoors") && !cats.has("park") && !cats.has("trail")) {
    next += 1;
  }
  if (likes.has("chill") && /chill|laid-back|unhurried|patio/.test(hay)) {
    next += 1;
  }

  const partyNight =
    intake.occasion === "birthday" ||
    intake.occasion === "bachelorette" ||
    intake.occasion === "bachelor";
  if (partyNight && (cats.has("bar") || cats.has("nightlife"))) next += 1;
  if (intake.partyKind === "family" && /family|plates|kid/.test(hay)) next += 1;

  if (
    (intake.weatherWant === "ac-indoor" || intake.weatherWant === "rain-ok") &&
    (cats.has("park") || cats.has("trail") || cats.has("pool"))
  ) {
    next -= 1;
  }
  if (intake.weatherWant === "hot" && /patio|outdoor|lake|pool/.test(hay)) {
    next += 1;
  }

  return Math.max(0, Math.min(10, next));
}

export function tierFromScore(score: number): Tier | null {
  if (score >= 8) return "top";
  if (score >= 5) return "middle";
  if (score >= 3) return "maybe";
  return null;
}

export function intakeWhyBit(intake: Intake): string {
  const bits = [
    partyLabel(intake),
    occasionLabel(intake),
    ...intake.groupLikes.slice(0, 3),
  ];
  return `Fits this trip (${bits.join(", ")}).`;
}

export function searchQueriesForCity(city: string, intake: Intake): string[] {
  const queries = [
    `${city} Eater map restaurants bars coffee`,
    `${city} Time Out restaurants bars coffee`,
    `${city} visitor bureau official dining restaurants`,
    `${city} best restaurants bars coffee local list`,
  ];
  const likes = new Set(intake.groupLikes);
  if (likes.has("drinkers") || likes.has("nightlife")) {
    queries.push(`${city} Eater dive bars nightlife map`);
  }
  if (likes.has("live-music")) {
    queries.push(`${city} live music venues list not tourist`);
  }
  if (likes.has("coffee")) {
    queries.push(`${city} Eater best coffee shops cafes map`);
  }
  if (likes.has("hikers") || likes.has("outdoors")) {
    queries.push(`${city} official parks trails outdoors visitor`);
  }
  if (likes.has("beach-water")) {
    queries.push(`${city} swimming hole lake pool official`);
  }
  if (likes.has("food-first")) {
    queries.push(`${city} best restaurants local dining guide`);
  }
  return unique(queries);
}

function intakeCategories(intake: Intake): string[] {
  const cats: string[] = [];
  for (const like of intake.groupLikes) {
    if (like === "drinkers" || like === "nightlife") {
      cats.push("bar", "nightlife");
    }
    if (like === "hikers" || like === "outdoors") cats.push("park", "trail");
    if (like === "coffee") cats.push("coffee");
    if (like === "food-first") cats.push("restaurant", "diner");
    if (like === "beach-water") cats.push("pool");
    if (like === "live-music") cats.push("bar");
  }
  return unique(cats);
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}
