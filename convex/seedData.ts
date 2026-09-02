import type { CitySource } from "./sources";

export const DEMO_SLUG = "usual-demo";

export const DEMO_TASTE = [
  {
    name: "Lester's Diner",
    city: "Fort Lauderdale",
    note: "Late eggs, a counter stool, and a waitress who already knows the order.",
  },
  {
    name: "Quiet Flight Surf Shop",
    city: "Fort Lauderdale",
    note: "Wax, boards, and nobody pushing a sale.",
  },
  {
    name: "The Poor House",
    city: "Fort Lauderdale",
    note: "Dark room, cheap beer, a band in the corner.",
  },
  {
    name: "Padrino's",
    city: "Plantation",
    note: "Cuban roast pork and plantains that taste like a Sunday.",
  },
  {
    name: "Brew Urban Cafe",
    city: "Fort Lauderdale",
    note: "Small counter, strong cortadito, nobody rushing you.",
  },
] as const;

export type DemoMatch = {
  name: string;
  neighborhood: string;
  homePlaceName: string;
  whyMirrors: string;
  goIfLine: string;
  sourceUrl: string;
};

const EATER_38 =
  "https://austin.eater.com/maps/best-restaurants-austin-eater-38";
const CHRONICLE = "https://www.austinchronicle.com/food/";
const VISIT = "https://www.austintexas.org/food-and-drink/";

export const AUSTIN_DEMO_MATCHES: DemoMatch[] = [
  {
    name: "Joe's Bakery & Coffee Shop",
    neighborhood: "East Austin",
    homePlaceName: "Lester's Diner",
    whyMirrors:
      "Eater 38 lists a bakery-coffee shop with the same counter-breakfast gravity as Lester's.",
    goIfLine: "Go here if you liked Lester's Diner.",
    sourceUrl: EATER_38,
  },
  {
    name: "Crown & Anchor Pub",
    neighborhood: "North Campus",
    homePlaceName: "The Poor House",
    whyMirrors:
      "Eater 38 calls out this campus pub — cheap pints, no polish, the Poor House energy.",
    goIfLine: "Go here if you liked The Poor House.",
    sourceUrl: EATER_38,
  },
  {
    name: "Better Half Coffee & Cocktails",
    neighborhood: "Clarksville",
    homePlaceName: "Brew Urban Cafe",
    whyMirrors:
      "On the Eater 38 as a coffee-and-cocktails counter, not a laptop farm.",
    goIfLine: "Go here if you liked Brew Urban Cafe.",
    sourceUrl: EATER_38,
  },
  {
    name: "Veracruz All Natural",
    neighborhood: "East Austin",
    homePlaceName: "Padrino's",
    whyMirrors:
      "Eater 38 staple for migas and tacos — the same everyday plate Padrino's is for Cuban food.",
    goIfLine: "Go here if you liked Padrino's.",
    sourceUrl: EATER_38,
  },
  {
    name: "Franklin Barbecue",
    neighborhood: "Downtown",
    homePlaceName: "Lester's Diner",
    whyMirrors:
      "Visit Austin and Eater 38 both treat the line as part of the meal. Institution, no fuss.",
    goIfLine: "Go here if you liked Lester's Diner.",
    sourceUrl: VISIT,
  },
  {
    name: "Bouldin Creek Café",
    neighborhood: "Bouldin Creek",
    homePlaceName: "Brew Urban Cafe",
    whyMirrors:
      "Eater 38 lists the South Austin cafe hang — sit as long as you want.",
    goIfLine: "Go here if you liked Brew Urban Cafe.",
    sourceUrl: EATER_38,
  },
  {
    name: "Distant Relatives",
    neighborhood: "East Austin",
    homePlaceName: "Quiet Flight Surf Shop",
    whyMirrors:
      "Eater 38 outdoor barbecue hang. Same unhurried, no-hard-sell feel as the surf shop.",
    goIfLine: "Go here if you liked Quiet Flight Surf Shop.",
    sourceUrl: EATER_38,
  },
  {
    name: "Nixta Taqueria",
    neighborhood: "East Austin",
    homePlaceName: "Padrino's",
    whyMirrors:
      "Eater 38 masa shop. If Padrino's is your Sunday plate, this is the Austin one.",
    goIfLine: "Go here if you liked Padrino's.",
    sourceUrl: EATER_38,
  },
];

export const AUSTIN_DEMO_EXCERPT = `Demo crawl excerpt — not a live Firecrawl run.

From Eater Austin 38 (${EATER_38}): Joe's Bakery & Coffee Shop, Crown & Anchor Pub, Better Half Coffee & Cocktails, Veracruz All Natural, Franklin Barbecue, Bouldin Creek Café, Distant Relatives, Nixta Taqueria.

From Austin Chronicle Food (${CHRONICLE}): neighborhood reviews and the city's weekly food desk.

From Visit Austin dining (${VISIT}): official visitor notes on barbecue, Tex-Mex, and coffee.

These names appear on those public pages. Usual labels this board as demo until a real crawl runs.`;

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
