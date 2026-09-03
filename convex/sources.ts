export type CitySource = {
  url: string;
  label: string;
};

const AUSTIN: CitySource[] = [
  {
    url: "https://austin.eater.com/maps/best-24-hour-restaurants-austin-cafes-diners-all-hours-24-7",
    label: "Eater Austin 24-hour map",
  },
  {
    url: "https://austin.eater.com/maps/south-congress-austin-best-restaurants-bars-dining-guide-where-to-eat-travis-heights-bouldin-creek",
    label: "Eater South Congress map",
  },
  {
    url: "https://www.habanaaustin.com/",
    label: "Habana Austin",
  },
  {
    url: "https://epochcoffee.com/",
    label: "Epoch Coffee",
  },
  {
    url: "https://austin.eater.com/maps/best-dive-bars-austin",
    label: "Eater Austin dive bars",
  },
  {
    url: "https://austin.eater.com/maps/best-coffee-austin-cafes-espressos-lattes",
    label: "Eater Austin coffee map",
  },
  {
    url: "https://www.austintexas.org/things-to-do/outdoors/",
    label: "Visit Austin outdoors",
  },
];

const LISBON: CitySource[] = [
  {
    url: "https://www.timeout.com/lisbon/restaurants",
    label: "Time Out Lisbon restaurants",
  },
  {
    url: "https://www.visitlisboa.com/en",
    label: "Visit Lisboa",
  },
];

const HOBOKEN: CitySource[] = [
  {
    url: "https://www.thejillbiggsgroup.com/blog/best-restaurants-hoboken-nj-2025-2026",
    label: "Jill Biggs, best restaurants Hoboken",
  },
  {
    url: "https://www.visithudson.org/restaurants/hoboken/",
    label: "Visit Hudson, Hoboken restaurants",
  },
  {
    url: "https://www.visithudson.org/restaurants/",
    label: "Visit Hudson restaurants",
  },
  {
    url: "https://ny.eater.com/maps/best-jersey-city-restaurants",
    label: "Eater, best Jersey City restaurants",
  },
];

export function sourcesForCity(city: string): CitySource[] {
  const key = city.trim().toLowerCase();
  if (key.includes("austin")) return AUSTIN;
  if (key.includes("lisbon") || key.includes("lisboa")) return LISBON;
  if (key.includes("hoboken") || key.includes("jersey city")) return HOBOKEN;
  return [];
}

export function mergeSources(
  primary: CitySource[],
  boost: CitySource[],
): CitySource[] {
  const seen = new Set<string>();
  const merged: CitySource[] = [];
  for (const source of [...primary, ...boost]) {
    const url = normalizeSourceUrl(source.url);
    if (url.length === 0 || seen.has(url)) continue;
    seen.add(url);
    merged.push({ url, label: source.label });
  }
  return merged;
}

export function normalizeSourceUrl(url: string): string {
  const trimmed = url.trim().split("#")[0] ?? "";
  if (!/^https?:\/\//i.test(trimmed)) return "";
  return trimmed.replace(/\/$/, "") || trimmed;
}

export function parseTripRequest(text: string): {
  city: string;
  dateLabel: string;
} | null {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length === 0) return null;

  if (/\baustin\b/i.test(cleaned) && /this weekend/i.test(cleaned)) {
    return { city: "Austin", dateLabel: "this weekend" };
  }

  const weekend = cleaned.match(
    /^(.+?)\s+(this weekend|next weekend|this week)$/i,
  );
  if (weekend?.[1]) {
    return {
      city: titleCase(weekend[1]),
      dateLabel: weekend[2].toLowerCase(),
    };
  }

  const inMonth = cleaned.match(/^(.+?)\s+in\s+([A-Za-z]+)$/i);
  if (inMonth?.[1] && inMonth[2]) {
    return {
      city: titleCase(inMonth[1]),
      dateLabel: titleCase(inMonth[2]),
    };
  }

  const dash = cleaned.match(/^(.+?)\s*[—–-]\s*(.+)$/);
  if (dash?.[1] && dash[2]) {
    return { city: titleCase(dash[1]), dateLabel: dash[2].trim() };
  }

  return { city: titleCase(cleaned), dateLabel: "whenever you land" };
}

function titleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
