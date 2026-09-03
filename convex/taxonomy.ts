export const CATEGORIES = [
  "diner",
  "coffee",
  "bar",
  "restaurant",
  "cuban",
  "shop",
  "bakery",
  "taco",
  "barbecue",
  "seafood",
  "nightlife",
  "park",
  "trail",
  "pool",
] as const;

export type Category = (typeof CATEGORIES)[number];

const CATEGORY_WORDS: Record<Category, string[]> = {
  diner: [
    "diner",
    "counter breakfast",
    "breakfast counter",
    "all-night",
    "around the clock",
    "24/7",
    "24 hour",
    "24-hour",
  ],
  coffee: ["coffee", "cafe", "café", "cortadito", "espresso", "latte"],
  bar: ["bar", "pub", "dive", "pints", "beer", "cocktails", "live music"],
  restaurant: [
    "restaurant",
    "plates",
    "supper",
    "dinner",
    "lunch",
    "taqueria",
    "kitchen",
  ],
  cuban: ["cuban", "ropa vieja", "habana", "plantains"],
  shop: ["shop", "surf", "boards", "wax", "retail", "gear"],
  bakery: ["bakery", "pastry", "kolache", "bread"],
  taco: ["taco", "taqueria", "migas", "masa"],
  barbecue: ["barbecue", "bbq", "brisket", "smoked"],
  seafood: ["seafood", "oyster", "fish", "raw bar"],
  nightlife: ["nightlife", "nightclub", "late night", "honky-tonk", "honky tonk"],
  park: ["park", "greenbelt", "zilker", "gardens"],
  trail: ["trail", "hike", "hiking", "greenbelt", "boardwalk"],
  pool: ["pool", "swimming hole", "springs", "lake", "barton springs"],
};

const SKIP_HEADINGS = [
  "more in",
  "the latest",
  "see more",
  "more maps",
  "related",
  "advertisement",
  "newsletter",
];

export type Anchor = {
  name: string;
  city: string;
  note: string;
  url: string | null;
  categories: string[];
  vibeTags: string[];
  priceBand: string | null;
  descriptors: string[];
};

export type Candidate = {
  name: string;
  neighborhood: string;
  categories: string[];
  snippet: string;
  sourceUrl: string;
};

export function inferFromText(text: string): {
  categories: string[];
  vibeTags: string[];
  priceBand: string | null;
  descriptors: string[];
} {
  const lower = text.toLowerCase();
  const categories = CATEGORIES.filter((category) =>
    CATEGORY_WORDS[category].some((word) => lower.includes(word)),
  );
  const vibeTags = inferVibeTags(lower);
  const priceBand = inferPrice(text);
  const descriptors = vibeTags.slice(0, 6);
  return {
    categories: categories.length > 0 ? categories : ["restaurant"],
    vibeTags,
    priceBand,
    descriptors,
  };
}

export function inferAnchor(name: string, note: string, extra = ""): Omit<
  Anchor,
  "name" | "city" | "url"
> {
  const inferred = inferFromText(`${name} ${note} ${extra}`);
  return {
    note,
    categories: inferred.categories,
    vibeTags: inferred.vibeTags.length > 0 ? inferred.vibeTags : ["usual"],
    priceBand: inferred.priceBand,
    descriptors: inferred.descriptors,
  };
}

export function rollupProfile(anchors: Anchor[]): {
  categories: string[];
  vibeTags: string[];
  priceBand: string | null;
} {
  const categories = unique(anchors.flatMap((anchor) => anchor.categories));
  const vibeTags = unique(anchors.flatMap((anchor) => anchor.vibeTags));
  const bands = anchors
    .map((anchor) => anchor.priceBand)
    .filter((band): band is string => Boolean(band));
  const priceBand = bands[0] ?? null;
  return { categories, vibeTags, priceBand };
}

export function categoryOverlap(a: string[], b: string[]): boolean {
  return a.some((item) => b.includes(item));
}

export function extractCandidates(
  markdown: string,
  sourceUrl: string,
): Candidate[] {
  const sections = splitSections(markdown);
  const found: Candidate[] = [];
  const seen = new Set<string>();

  for (const section of sections) {
    const name = cleanName(section.heading);
    if (!name || !isGrounded(name, markdown)) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const inferred = inferFromText(`${name} ${section.body}`);
    found.push({
      name,
      neighborhood: inferNeighborhood(section.body),
      categories: inferred.categories,
      snippet: quoteSnippet(section.body, name),
      sourceUrl,
    });
  }

  return found.slice(0, 80);
}

export function buildWhyLine(input: {
  anchor: string;
  tag: string;
  candidate: string;
  quote: string;
}): string {
  const quote = input.quote.replace(/\s+/g, " ").trim();
  return `you liked ${input.anchor} because ${input.tag}. ${input.candidate} because ${input.tag}. "${quote}"`;
}

export function pickQuote(snippet: string, proposed?: string): string | null {
  const cleanSnippet = snippet.replace(/\s+/g, " ").trim();
  if (cleanSnippet.length === 0) return null;
  if (proposed) {
    const quote = proposed.replace(/\s+/g, " ").trim();
    if (
      quote.length > 0 &&
      cleanSnippet.toLowerCase().includes(quote.toLowerCase())
    ) {
      return quote.slice(0, 180);
    }
  }
  return cleanSnippet.slice(0, 180);
}

function inferVibeTags(lower: string): string[] {
  const tags: Array<[string, string[]]> = [
    ["24/7 booth", ["24/7", "around the clock", "booth", "24 hour"]],
    ["late", ["late", "night", "after hours"]],
    ["coffee", ["coffee", "coffee pot"]],
    ["family Cuban", ["family cuban", "cuban plates", "ropa vieja"]],
    ["cuban", ["cuban", "plantains", "habana"]],
    ["plates", ["plates", "plate", "sunday"]],
    ["dive", ["dive", "dive energy"]],
    ["live-music", ["live music", "live-music", "band"]],
    ["not a chain", ["not a chain", "independent coffee"]],
    ["local", ["local", "two rooms"]],
    ["surf", ["surf", "boards", "wax"]],
    ["water", ["swimming", "lake", "springs", "pool"]],
    ["outdoors", ["park", "trail", "hike", "outdoors", "greenbelt"]],
    ["family", ["family", "since 1978"]],
    ["gear", ["gear", "boards", "wax", "surf"]],
    ["counter", ["counter", "stool", "counter stool"]],
    ["no-fuss", ["no fuss", "no-fuss", "institution", "no polish"]],
    ["cheap", ["cheap", "pints"]],
    ["unhurried", ["nobody rushing", "unhurried", "no rush"]],
  ];
  return tags
    .filter(([, words]) => words.some((word) => lower.includes(word)))
    .map(([tag]) => tag);
}

function inferPrice(text: string): string | null {
  if (/\$\$\$\$/.test(text)) return "$$$$";
  if (/\$\$\$/.test(text)) return "$$$";
  if (/\$\$/.test(text)) return "$$";
  if (/\$/.test(text)) return "$";
  if (/\bcheap\b|\bdive\b|\bcounter\b/i.test(text)) return "$";
  return null;
}

function inferNeighborhood(body: string): string {
  const location = body.match(
    /Location[:\s]+([^,\n]+(?:,\s*[^,\n]+){0,2})/i,
  );
  if (location?.[1]) {
    const bit = location[1]
      .replace(/Austin.*$/i, "")
      .replace(/\d{3,}.*/, "")
      .trim();
    if (bit.length > 2 && bit.length < 40) return bit;
  }
  const known = [
    "East Austin",
    "South Austin",
    "North Austin",
    "Downtown",
    "Clarksville",
    "Bouldin Creek",
    "North Campus",
    "Tarrytown",
    "North Loop",
    "South Congress",
    "Airport Blvd",
    "Hoboken",
    "Jersey City",
    "Weehawken",
    "Barrington Oaks",
  ];
  for (const name of known) {
    if (body.toLowerCase().includes(name.toLowerCase())) return name;
  }
  return "unknown";
}

function splitSections(
  markdown: string,
): Array<{ heading: string; body: string }> {
  const lines = markdown.split(/\n/);
  const sections: Array<{ heading: string; body: string }> = [];
  let current: { heading: string; body: string } | null = null;
  for (const line of lines) {
    const heading = line.match(/^#{2,3}\s+(.+)$/);
    if (heading?.[1]) {
      if (current) sections.push(current);
      current = { heading: heading[1], body: "" };
      continue;
    }
    if (current) current.body += `${line}\n`;
  }
  if (current) sections.push(current);
  return sections;
}

function cleanName(heading: string): string | null {
  const name = heading
    .replace(/\[([^\]]+)].*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (name.length < 3 || name.length > 70) return null;
  const lower = name.toLowerCase();
  if (SKIP_HEADINGS.some((skip) => lower.startsWith(skip))) return null;
  if (/^the \d+/.test(lower)) return null;
  if (/^best /.test(lower)) return null;
  if (/^where to/.test(lower)) return null;
  return name;
}

function isGrounded(name: string, markdown: string): boolean {
  return markdown.toLowerCase().includes(name.toLowerCase());
}

function quoteSnippet(body: string, name: string): string {
  const text = body
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[#*_>`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length > 20) return text.slice(0, 280);
  return name;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}
