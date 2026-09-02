"use node";

import { generateText } from "ai";
import { convexGateway } from "@convex-dev/ai-sdk-provider";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

export const fromCrawl = internalAction({
  args: { tripId: v.id("trips") },
  returns: v.object({
    usedModel: v.boolean(),
    count: v.number(),
  }),
  handler: async (ctx, args) => {
    const trip = await ctx.runQuery(api.trips.get, { tripId: args.tripId });
    if (!trip) throw new Error("Trip not found.");
    const taste = await ctx.runQuery(api.taste.list, {
      profileId: trip.profileId,
    });
    const pages = await ctx.runQuery(api.crawls.listMarkdown, {
      tripId: args.tripId,
    });

    const crawled = pages
      .map(
        (page) =>
          `SOURCE ${page.label} (${page.url})\n${page.markdown.slice(0, 6000)}`,
      )
      .join("\n\n");
    const tasteLines = taste
      .map((place) => `- ${place.name} (${place.city}): ${place.note}`)
      .join("\n");

    const result = await proposeMatches({
      city: trip.city,
      tasteLines,
      crawled,
    });

    await ctx.runMutation(internal.crawls.replaceMatches, {
      tripId: args.tripId,
      matches: result.matches,
      matchNote: result.note,
    });

    const draft = [
      `${trip.city}, ${trip.dateLabel}.`,
      "",
      result.note,
      "",
      ...result.matches.map(
        (match) =>
          `• ${match.name} (${match.neighborhood}) — ${match.goIfLine}`,
      ),
      "",
      "Usual does not send this until you tap Send.",
    ].join("\n");

    await ctx.runMutation(api.trips.saveDraft, {
      tripId: args.tripId,
      emailSubject: `Your usual, in ${trip.city} — ${trip.dateLabel}`,
      emailDraft: draft,
    });

    return { usedModel: result.usedModel, count: result.matches.length };
  },
});

async function proposeMatches(input: {
  city: string;
  tasteLines: string;
  crawled: string;
}): Promise<{
  matches: Array<{
    name: string;
    neighborhood: string;
    homePlaceName: string;
    whyMirrors: string;
    goIfLine: string;
    source: "crawl" | "demo" | "model_guess" | "placeholder";
    sourceUrl: string | null;
    grounded: boolean;
  }>;
  note: string;
  usedModel: boolean;
}> {
  const prompt = `You match a traveler's home-city usuals to places in ${input.city}.

TASTE:
${input.tasteLines}

CRAWLED PUBLIC PAGES:
${input.crawled}

Return JSON only: { "matches": [ ... 8 items ... ] }
Each item:
- name: place name that appears in the crawled text
- neighborhood: from the crawl if present, else "unknown"
- homePlaceName: which taste spot it mirrors
- whyMirrors: one sentence
- goIfLine: "Go here if you liked X."
- sourceUrl: the source URL from the crawl that mentioned the place
- grounded: true only if the name appears in the crawled text
- source: "crawl" if grounded, else "model_guess"

Never invent a grounded place. If you are guessing, source must be model_guess and grounded false. Prefer grounded names. Max 8.`;

  const raw = await callModel(prompt);
  if (!raw.ok) {
    return {
      usedModel: false,
      note: "[Placeholder — no OpenAI or Convex AI Gateway] No live model response. Crawl text is stored; matches were not invented.",
      matches: [],
    };
  }

  const parsed = parseModelMatches(raw.text, input.crawled);
  return {
    usedModel: true,
    note: `Live model pass (${raw.model}). Grounded names preferred from crawled pages.`,
    matches: parsed,
  };
}

async function callModel(
  prompt: string,
): Promise<{ ok: true; text: string; model: string } | { ok: false }> {
  try {
    const { text } = await generateText({
      model: convexGateway("openai/gpt-4o-mini"),
      prompt,
    });
    if (text.trim().length > 0) {
      return { ok: true, text, model: "openai/gpt-4o-mini via Convex AI Gateway" };
    }
  } catch {
    // Gateway disabled, unpaid, or local — try OPENAI_API_KEY next.
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { ok: false };

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });
    if (!response.ok) return { ok: false };
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    if (text.trim().length === 0) return { ok: false };
    return { ok: true, text, model: "gpt-4o-mini via OPENAI_API_KEY" };
  } catch {
    return { ok: false };
  }
}

function parseModelMatches(
  text: string,
  crawled: string,
): Array<{
  name: string;
  neighborhood: string;
  homePlaceName: string;
  whyMirrors: string;
  goIfLine: string;
  source: "crawl" | "model_guess";
  sourceUrl: string | null;
  grounded: boolean;
}> {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return [];
  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      matches?: Array<Record<string, unknown>>;
    };
    const crawlLower = crawled.toLowerCase();
    return (parsed.matches ?? []).slice(0, 8).map((item) => {
      const name = String(item.name ?? "").trim();
      const grounded =
        name.length > 0 && crawlLower.includes(name.toLowerCase());
      return {
        name: name || "Unnamed",
        neighborhood: String(item.neighborhood ?? "unknown"),
        homePlaceName: String(item.homePlaceName ?? "your usual"),
        whyMirrors: String(item.whyMirrors ?? ""),
        goIfLine: String(
          item.goIfLine ?? `Go here if you liked ${item.homePlaceName ?? "your usual"}.`,
        ),
        source: grounded ? "crawl" : "model_guess",
        sourceUrl: item.sourceUrl ? String(item.sourceUrl) : null,
        grounded,
      };
    });
  } catch {
    return [];
  }
}
