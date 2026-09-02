import { buildWhyLine } from "./taxonomy";

export const DEMO_SLUG = "usual-demo";

export const INBOUND_SUBJECT = "Austin this weekend";
export const INBOUND_BODY =
  "Austin this weekend. Same kind of places I go at home. Diner, Cuban, a real bar, coffee that isn’t a chain. Don’t send me Sixth Street.";

export const OUTBOUND_SUBJECT = "Your usual, in Austin";
export const SURF_MISS =
  "No grounded surf shop in this crawl. We didn’t make one up.";

export const EATER_24H =
  "https://austin.eater.com/maps/best-24-hour-restaurants-austin-cafes-diners-all-hours-24-7";
export const EATER_SOCO =
  "https://austin.eater.com/maps/south-congress-austin-best-restaurants-bars-dining-guide-where-to-eat-travis-heights-bouldin-creek";
export const HABANA_URL = "https://www.habanaaustin.com/";
export const EPOCH_URL = "https://epochcoffee.com/";

export const DEMO_TASTE = [
  {
    name: "Lester’s Diner",
    city: "Fort Lauderdale",
    note: "24/7 booth, cake spinner, they keep the 14oz coffee full",
    url: null as string | null,
    categories: ["diner", "restaurant"],
    vibeTags: ["24/7 booth", "late", "coffee"],
    priceBand: "$",
    descriptors: ["24/7 booth", "late", "coffee"],
  },
  {
    name: "Padrino’s Cuban Cuisine",
    city: "Fort Lauderdale",
    note: "family Cuban, ropa vieja, not the Las Olas rum-bar version",
    url: null,
    categories: ["restaurant", "cuban"],
    vibeTags: ["family Cuban", "plates"],
    priceBand: "$$",
    descriptors: ["family Cuban", "ropa vieja", "plates"],
  },
  {
    name: "Elbo Room",
    city: "Fort Lauderdale Beach",
    note: "corner of Las Olas and A1A, dive, live music",
    url: null,
    categories: ["bar"],
    vibeTags: ["dive", "live-music"],
    priceBand: "$",
    descriptors: ["dive", "live-music", "corner"],
  },
  {
    name: "BREW Urban Cafe",
    city: "Fort Lauderdale",
    note: "small local coffee, two rooms downtown, not a chain",
    url: null,
    categories: ["coffee"],
    vibeTags: ["not a chain", "local", "two rooms"],
    priceBand: "$",
    descriptors: ["not a chain", "local", "two rooms"],
  },
  {
    name: "Island Water Sports",
    city: "Deerfield/Pompano",
    note: "family surf shop since 1978",
    url: null,
    categories: ["shop"],
    vibeTags: ["surf", "family", "gear"],
    priceBand: null,
    descriptors: ["surf", "family", "since 1978"],
  },
] as const;

export type DemoMatch = {
  name: string;
  neighborhood: string;
  homePlaceName: string;
  score: number;
  vibeTag: string;
  quote: string;
  sourceUrl: string;
};

export type DemoPage = {
  url: string;
  label: string;
  markdown: string;
  matches: DemoMatch[];
};

export const AUSTIN_DEMO_PAGES: DemoPage[] = [
  {
    url: EATER_24H,
    label: "Eater Austin 24-hour map",
    markdown: `## 24 Diner
Airport Blvd. Open around the clock. Booths, a full coffee pot, no last call.

## Epoch Coffee
North Loop. Independent coffee rooms. Not a chain. Open when the rest of town is closed.`,
    matches: [
      {
        name: "24 Diner",
        neighborhood: "Airport Blvd",
        homePlaceName: "Lester’s Diner",
        score: 9,
        vibeTag: "24/7 booth",
        quote: "Open around the clock. Booths, a full coffee pot, no last call.",
        sourceUrl: EATER_24H,
      },
      {
        name: "Epoch Coffee, North Loop",
        neighborhood: "North Loop",
        homePlaceName: "BREW Urban Cafe",
        score: 8,
        vibeTag: "not a chain",
        quote: "Independent coffee rooms. Not a chain.",
        sourceUrl: EATER_24H,
      },
    ],
  },
  {
    url: EATER_SOCO,
    label: "Eater South Congress map",
    markdown: `## Continental Club
South Congress. Live-music room with dive energy. Not Sixth Street.

## Habana Austin
South Congress. Family Cuban plates. Ropa vieja, not a rum bar.`,
    matches: [
      {
        name: "Continental Club",
        neighborhood: "South Congress",
        homePlaceName: "Elbo Room",
        score: 9,
        vibeTag: "dive",
        quote: "Live-music room with dive energy. Not Sixth Street.",
        sourceUrl: EATER_SOCO,
      },
      {
        name: "Habana Austin",
        neighborhood: "South Congress",
        homePlaceName: "Padrino’s Cuban Cuisine",
        score: 8,
        vibeTag: "family Cuban",
        quote: "Family Cuban plates. Ropa vieja, not a rum bar.",
        sourceUrl: EATER_SOCO,
      },
    ],
  },
  {
    url: HABANA_URL,
    label: "Habana Austin",
    markdown: `## Habana Austin
Cuban restaurant on South Congress. Family tables. Ropa vieja, not a rum bar.`,
    matches: [
      {
        name: "Habana Austin",
        neighborhood: "South Congress",
        homePlaceName: "Padrino’s Cuban Cuisine",
        score: 8,
        vibeTag: "family Cuban",
        quote: "Family tables. Ropa vieja, not a rum bar.",
        sourceUrl: HABANA_URL,
      },
    ],
  },
  {
    url: EPOCH_URL,
    label: "Epoch Coffee",
    markdown: `## Epoch Coffee
North Loop. Independent coffee rooms. Not a chain.`,
    matches: [
      {
        name: "Epoch Coffee, North Loop",
        neighborhood: "North Loop",
        homePlaceName: "BREW Urban Cafe",
        score: 8,
        vibeTag: "not a chain",
        quote: "Independent coffee rooms. Not a chain.",
        sourceUrl: EPOCH_URL,
      },
    ],
  },
];

export const SURF_MISS_CARD = {
  name: "Island Water Sports",
  neighborhood: "Austin",
  homePlaceName: "Island Water Sports",
  score: 0,
  vibeTag: "surf",
  quote: SURF_MISS,
  whyLine: SURF_MISS,
} as const;

export function demoWhy(match: DemoMatch): string {
  return buildWhyLine({
    anchor: match.homePlaceName,
    tag: match.vibeTag,
    candidate: match.name,
    quote: match.quote,
  });
}

export function buildAustinOutbound(matches: DemoMatch[]): string {
  const lines = matches.map(
    (match) =>
      `• ${match.name} (${match.neighborhood}) — ${demoWhy(match)}`,
  );
  return [
    OUTBOUND_SUBJECT,
    "",
    ...lines,
    "",
    `Island Water Sports — ${SURF_MISS}`,
    "",
    "No Sixth Street.",
  ].join("\n");
}

export const AUSTIN_MATCH_ORDER = [
  "24 Diner",
  "Continental Club",
  "Habana Austin",
  "Epoch Coffee, North Loop",
] as const;

export const EXPECTED_TASTE_NAMES = DEMO_TASTE.map((spot) => spot.name);
