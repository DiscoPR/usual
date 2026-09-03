export const PARTY_KINDS = [
  { id: "solo", label: "Solo" },
  { id: "couple", label: "Couple" },
  { id: "friends", label: "Friends" },
  { id: "family", label: "Family" },
  { id: "named_group", label: "Named group" },
] as const;

export const OCCASIONS = [
  { id: "none", label: "None / just a trip" },
  { id: "birthday", label: "Birthday" },
  { id: "wedding", label: "Wedding" },
  { id: "bachelorette", label: "Bachelorette" },
  { id: "bachelor", label: "Bachelor" },
] as const;

export const GROUP_LIKES = [
  { id: "drinkers", label: "Drinkers" },
  { id: "hikers", label: "Hikers" },
  { id: "outdoors", label: "Outdoors" },
  { id: "indoors", label: "Indoors" },
  { id: "food-first", label: "Food-first" },
  { id: "live-music", label: "Live music" },
  { id: "coffee", label: "Coffee" },
  { id: "beach-water", label: "Beach / water" },
  { id: "nightlife", label: "Nightlife" },
  { id: "chill", label: "Chill" },
] as const;

export const WEATHER_WANTS = [
  { id: "hot", label: "Hot" },
  { id: "mild", label: "Mild" },
  { id: "rain-ok", label: "Rain-ok" },
  { id: "ac-indoor", label: "AC / indoor backup" },
] as const;

export type PartyKind = (typeof PARTY_KINDS)[number]["id"];
export type Occasion = (typeof OCCASIONS)[number]["id"];
export type GroupLike = (typeof GROUP_LIKES)[number]["id"];
export type WeatherWant = (typeof WEATHER_WANTS)[number]["id"];

export type Intake = {
  partyKind: PartyKind;
  partyName: string;
  occasion: Occasion;
  groupLikes: GroupLike[];
  weatherWant: WeatherWant;
};

export const DEFAULT_INTAKE: Intake = {
  partyKind: "friends",
  partyName: "",
  occasion: "none",
  groupLikes: ["food-first", "coffee", "drinkers"],
  weatherWant: "mild",
};

export function toggleLike(current: GroupLike[], like: GroupLike): GroupLike[] {
  if (current.includes(like)) {
    const next = current.filter((item) => item !== like);
    return next.length > 0 ? next : current;
  }
  return [...current, like];
}
