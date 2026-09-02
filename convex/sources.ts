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

export function sourcesForCity(city: string): CitySource[] {
  const key = city.trim().toLowerCase();
  if (key.includes("austin")) return AUSTIN;
  if (key.includes("lisbon") || key.includes("lisboa")) return LISBON;
  return [];
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
