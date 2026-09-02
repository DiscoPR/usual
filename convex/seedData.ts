import { buildWhyLine } from "./taxonomy";
import type { CitySource } from "./sources";

export const DEMO_SLUG = "usual-demo";

export const DEMO_TASTE = [
  {
    name: "Lester's Diner",
    city: "Fort Lauderdale",
    note: "Late eggs, a counter stool, and a waitress who already knows the order.",
    url: null as string | null,
    categories: ["diner", "restaurant"],
    vibeTags: ["counter", "late", "no-fuss"],
    priceBand: "$",
    descriptors: ["counter", "late", "no-fuss"],
  },
  {
    name: "Quiet Flight Surf Shop",
    city: "Fort Lauderdale",
    note: "Wax, boards, and nobody pushing a sale.",
    url: null,
    categories: ["shop"],
    vibeTags: ["no-hard-sell", "hang", "gear"],
    priceBand: null,
    descriptors: ["no-hard-sell", "hang"],
  },
  {
    name: "The Poor House",
    city: "Fort Lauderdale",
    note: "Dark room, cheap beer, a band in the corner.",
    url: null,
    categories: ["bar"],
    vibeTags: ["cheap", "dark", "live-music"],
    priceBand: "$",
    descriptors: ["cheap", "dark", "live-music"],
  },
  {
    name: "Padrino's",
    city: "Plantation",
    note: "Cuban roast pork and plantains that taste like a Sunday.",
    url: null,
    categories: ["restaurant"],
    vibeTags: ["cuban", "plates"],
    priceBand: "$$",
    descriptors: ["cuban", "plates"],
  },
  {
    name: "Brew Urban Cafe",
    city: "Fort Lauderdale",
    note: "Small counter, strong cortadito, nobody rushing you.",
    url: null,
    categories: ["coffee"],
    vibeTags: ["counter", "unhurried", "cortadito"],
    priceBand: "$",
    descriptors: ["counter", "unhurried", "cortadito"],
  },
] as const;

export const EATER_38 =
  "https://austin.eater.com/maps/best-restaurants-austin-eater-38";
export const VISIT_AUSTIN = "https://www.austintexas.org/food-and-drink/";

export type DemoMatch = {
  name: string;
  neighborhood: string;
  homePlaceName: string;
  score: number;
  vibeTag: string;
  quote: string;
  sourceUrl: string;
};

export const AUSTIN_DEMO_MATCHES: DemoMatch[] = [
  {
    name: "Joe's Bakery & Coffee Shop",
    neighborhood: "East Austin",
    homePlaceName: "Lester's Diner",
    score: 9,
    vibeTag: "counter",
    quote: "Counter breakfast, no fuss.",
    sourceUrl: EATER_38,
  },
  {
    name: "Crown & Anchor Pub",
    neighborhood: "North Campus",
    homePlaceName: "The Poor House",
    score: 8,
    vibeTag: "cheap",
    quote: "Cheap pints, no polish.",
    sourceUrl: EATER_38,
  },
  {
    name: "Better Half Coffee & Cocktails",
    neighborhood: "Clarksville",
    homePlaceName: "Brew Urban Cafe",
    score: 8,
    vibeTag: "counter",
    quote: "Coffee-and-cocktails counter, not a laptop farm.",
    sourceUrl: EATER_38,
  },
  {
    name: "Veracruz All Natural",
    neighborhood: "East Austin",
    homePlaceName: "Padrino's",
    score: 8,
    vibeTag: "plates",
    quote: "Everyday tacos and migas plates.",
    sourceUrl: EATER_38,
  },
  {
    name: "Franklin Barbecue",
    neighborhood: "Downtown",
    homePlaceName: "Lester's Diner",
    score: 8,
    vibeTag: "no-fuss",
    quote: "The line is part of the meal. Institution, no fuss.",
    sourceUrl: VISIT_AUSTIN,
  },
  {
    name: "Bouldin Creek Café",
    neighborhood: "Bouldin Creek",
    homePlaceName: "Brew Urban Cafe",
    score: 8,
    vibeTag: "unhurried",
    quote: "South Austin cafe hang — sit as long as you want.",
    sourceUrl: EATER_38,
  },
  {
    name: "Nixta Taqueria",
    neighborhood: "East Austin",
    homePlaceName: "Padrino's",
    score: 8,
    vibeTag: "plates",
    quote: "Masa shop. Sunday plate energy.",
    sourceUrl: EATER_38,
  },
  {
    name: "Distant Relatives",
    neighborhood: "East Austin",
    homePlaceName: "Lester's Diner",
    score: 7,
    vibeTag: "no-fuss",
    quote: "Outdoor barbecue hang. Unhurried, no-fuss plates.",
    sourceUrl: EATER_38,
  },
];

export function demoWhy(match: DemoMatch): string {
  return buildWhyLine({
    anchor: match.homePlaceName,
    tag: match.vibeTag,
    candidate: match.name,
    quote: match.quote,
  });
}

export const AUSTIN_DEMO_EXCERPT = `Demo crawl excerpt — not a live Firecrawl run.

## Joe's Bakery & Coffee Shop
East Austin. Counter breakfast, no fuss.

## Crown & Anchor Pub
North Campus. Cheap pints, no polish.

## Better Half Coffee & Cocktails
Clarksville. Coffee-and-cocktails counter, not a laptop farm.

## Veracruz All Natural
East Austin. Everyday tacos and migas plates.

## Franklin Barbecue
Downtown. The line is part of the meal. Institution, no fuss.

## Bouldin Creek Café
Bouldin Creek. South Austin cafe hang — sit as long as you want.

## Nixta Taqueria
East Austin. Masa shop. Sunday plate energy.

## Distant Relatives
East Austin. Outdoor barbecue hang. Unhurried, no-fuss plates.

Source pages: ${EATER_38} and ${VISIT_AUSTIN}.
Usual labels this board as demo until a real crawl runs.`;

export function demoPagesForAustin(): Array<
  CitySource & { markdown: string }
> {
  return [
    {
      url: EATER_38,
      label: "Eater Austin 38",
      markdown: AUSTIN_DEMO_EXCERPT,
    },
  ];
}
