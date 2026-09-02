import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseCsvPlaces(text: string): Array<{
  name: string;
  city: string;
  note: string;
}> {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const rows = [];
  for (const line of lines) {
    const parts = line.split(",").map((part) => part.trim().replace(/^"|"$/g, ""));
    if (parts[0]?.toLowerCase() === "name") continue;
    const [name, city, ...rest] = parts;
    if (!name || !city) continue;
    rows.push({ name, city, note: rest.join(", ") });
  }
  return rows;
}
