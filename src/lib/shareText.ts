export function usualsCsv(
  places: Array<{ name: string; city: string; note: string; url?: string | null }>,
): string {
  const lines = ["name,city,note,url"];
  for (const place of places) {
    lines.push(
      [place.name, place.city, place.note, place.url ?? ""]
        .map(csvCell)
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

export function usualsShareText(
  places: Array<{ name: string; city: string; note: string }>,
): string {
  const lines = places.map(
    (place) => `• ${place.name} (${place.city}). ${place.note}`,
  );
  return ["Your usuals", "", ...lines, ""].join("\n");
}

export function downloadText(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}
