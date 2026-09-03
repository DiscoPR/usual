import { buildWhyLine } from "./taxonomy";

export const DEMO_SLUG = "usual-demo";

export const INBOUND_SUBJECT = "Austin this weekend";
export const INBOUND_BODY =
  "Austin this weekend. Same kind of places I go at home. Diner, Cuban, a real bar, coffee that isn’t a chain. Don’t send me Sixth Street.";

export const OUTBOUND_SUBJECT = "Your usual, in Austin";
export const SURF_MISS =
  "No grounded surf shop in this crawl. We didn't make one up.";

export const EATER_24H =
  "https://austin.eater.com/maps/best-24-hour-restaurants-austin-cafes-diners-all-hours-24-7";
export const EATER_SOCO =
  "https://austin.eater.com/maps/south-congress-austin-best-restaurants-bars-dining-guide-where-to-eat-travis-heights-bouldin-creek";
export const HABANA_URL = "https://www.habanaaustin.com/";
export const EPOCH_URL = "https://epochcoffee.com/";
export const EATER_DIVES = "https://austin.eater.com/maps/best-dive-bars-austin";
export const EATER_COFFEE =
  "https://austin.eater.com/maps/best-coffee-austin-cafes-espressos-lattes";
export const VISIT_OUTDOORS =
  "https://www.austintexas.org/things-to-do/outdoors/";

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

## Kerbey Lane Cafe
All-day diner plates. Late breakfast, coffee, no last seating rush.

## Joe's Bakery
East Austin bakery and diner counter. Breakfast plates since long before the tourist lists.

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
        name: "Kerbey Lane Cafe",
        neighborhood: "Central Austin",
        homePlaceName: "Lester’s Diner",
        score: 7,
        vibeTag: "late",
        quote: "All-day diner plates. Late breakfast, coffee, no last seating rush.",
        sourceUrl: EATER_24H,
      },
      {
        name: "Joe's Bakery",
        neighborhood: "East Austin",
        homePlaceName: "Lester’s Diner",
        score: 5,
        vibeTag: "plates",
        quote: "East Austin bakery and diner counter. Breakfast plates since long before the tourist lists.",
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
South Congress. Family Cuban plates. Ropa vieja, not a rum bar.

## Bouldin Creek Cafe
South Congress side street. Vegetarian plates and local coffee. Not a chain.`,
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
        score: 9,
        vibeTag: "family Cuban",
        quote: "Family Cuban plates. Ropa vieja, not a rum bar.",
        sourceUrl: EATER_SOCO,
      },
      {
        name: "Bouldin Creek Cafe",
        neighborhood: "Bouldin Creek",
        homePlaceName: "BREW Urban Cafe",
        score: 6,
        vibeTag: "local",
        quote: "Vegetarian plates and local coffee. Not a chain.",
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
        score: 9,
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
  {
    url: EATER_DIVES,
    label: "Eater Austin dive bars",
    markdown: `## The White Horse
East Austin honky-tonk. Nightly live music, cheap whiskey, dive floor. Not Sixth Street.

## Donn's Depot
Clarksville dive in an old train station. Live music and two-step, no polish.

## Hole in the Wall
The Drag. Cheap drinks, two stages, punk and rock. Student dive energy.`,
    matches: [
      {
        name: "The White Horse",
        neighborhood: "East Austin",
        homePlaceName: "Elbo Room",
        score: 8,
        vibeTag: "live-music",
        quote: "Nightly live music, cheap whiskey, dive floor. Not Sixth Street.",
        sourceUrl: EATER_DIVES,
      },
      {
        name: "Donn's Depot",
        neighborhood: "Clarksville",
        homePlaceName: "Elbo Room",
        score: 6,
        vibeTag: "dive",
        quote: "Clarksville dive in an old train station. Live music and two-step, no polish.",
        sourceUrl: EATER_DIVES,
      },
      {
        name: "Hole in the Wall",
        neighborhood: "The Drag",
        homePlaceName: "Elbo Room",
        score: 4,
        vibeTag: "dive",
        quote: "Cheap drinks, two stages, punk and rock. Student dive energy.",
        sourceUrl: EATER_DIVES,
      },
    ],
  },
  {
    url: EATER_COFFEE,
    label: "Eater Austin coffee map",
    markdown: `## Radio Coffee & Beer
South Austin cafe and bar. Independent coffee, later beers, live music some nights.

## Figure 8 Coffee Purveyors
East Austin coffee counter. Small local rooms, not a chain.`,
    matches: [
      {
        name: "Radio Coffee & Beer",
        neighborhood: "South Austin",
        homePlaceName: "BREW Urban Cafe",
        score: 6,
        vibeTag: "local",
        quote: "Independent coffee, later beers, live music some nights.",
        sourceUrl: EATER_COFFEE,
      },
      {
        name: "Figure 8 Coffee Purveyors",
        neighborhood: "East Austin",
        homePlaceName: "BREW Urban Cafe",
        score: 4,
        vibeTag: "not a chain",
        quote: "Small local rooms, not a chain.",
        sourceUrl: EATER_COFFEE,
      },
    ],
  },
  {
    url: VISIT_OUTDOORS,
    label: "Visit Austin outdoors",
    markdown: `## Barton Springs Pool
Zilker Park swimming hole. Spring-fed water, not a surf shop.

## Zilker Park
Central lawns and trails by the springs. Daylight hang, no cover charge.

## Lady Bird Lake
Downtown trail around the lake. Walking and paddling, not a store.`,
    matches: [
      {
        name: "Barton Springs Pool",
        neighborhood: "Zilker",
        homePlaceName: "Island Water Sports",
        score: 4,
        vibeTag: "water",
        quote: "Spring-fed water, not a surf shop.",
        sourceUrl: VISIT_OUTDOORS,
      },
      {
        name: "Zilker Park",
        neighborhood: "Zilker",
        homePlaceName: "Island Water Sports",
        score: 3,
        vibeTag: "outdoors",
        quote: "Central lawns and trails by the springs. Daylight hang, no cover charge.",
        sourceUrl: VISIT_OUTDOORS,
      },
      {
        name: "Lady Bird Lake",
        neighborhood: "Downtown",
        homePlaceName: "Island Water Sports",
        score: 3,
        vibeTag: "outdoors",
        quote: "Walking and paddling, not a store.",
        sourceUrl: VISIT_OUTDOORS,
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
    (match) => `• ${match.name} (${match.neighborhood}). ${demoWhy(match)}`,
  );
  return [
    OUTBOUND_SUBJECT,
    "",
    ...lines,
    "",
    `Island Water Sports. ${SURF_MISS}`,
    "",
    "No Sixth Street.",
  ].join("\n");
}

export const AUSTIN_MATCH_ORDER = [
  "24 Diner",
  "Habana Austin",
  "Continental Club",
  "Epoch Coffee, North Loop",
  "The White Horse",
  "Kerbey Lane Cafe",
  "Radio Coffee & Beer",
  "Donn's Depot",
  "Bouldin Creek Cafe",
  "Joe's Bakery",
  "Hole in the Wall",
  "Figure 8 Coffee Purveyors",
  "Barton Springs Pool",
  "Zilker Park",
  "Lady Bird Lake",
] as const;

export const EXPECTED_TASTE_NAMES = DEMO_TASTE.map((spot) => spot.name);
