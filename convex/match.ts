"use node";

import { generateText } from "ai";
import { convexGateway } from "@convex-dev/ai-sdk-provider";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { internalAction, type ActionCtx } from "./_generated/server";
import { AUSTIN_MATCH_ORDER } from "./seedData";
import {
  buildWhyLine,
  categoryOverlap,
  extractCandidates,
  pickQuote,
  type Anchor,
  type Candidate,
} from "./taxonomy";

type FromPageResult = {
  candidates: number;
  kept: number;
  usedModel: boolean;
};

type Scored = {
  candidate: Candidate;
  anchor: Anchor;
  score: number;
  tag: string;
  quote: string;
  whyLine: string;
};

type ScoreResult = {
  rows: Scored[];
  usedModel: boolean;
};

export const fromPage = internalAction({
  args: { pageId: v.id("crawlPages") },
  returns: v.object({
    candidates: v.number(),
    kept: v.number(),
    usedModel: v.boolean(),
  }),
  handler: async (ctx: ActionCtx, args): Promise<FromPageResult> => {
    const page = await ctx.runQuery(internal.crawls.getPage, {
      pageId: args.pageId,
    });
    if (!page || !page.markdown) {
      return { candidates: 0, kept: 0, usedModel: false };
    }
    const markdown: string = page.markdown;
    const trip = await ctx.runQuery(api.trips.get, { tripId: page.tripId });
    if (!trip) return { candidates: 0, kept: 0, usedModel: false };

    const extracted: Candidate[] = extractCandidates(markdown, page.url).filter(
      (candidate: Candidate) =>
        markdown.toLowerCase().includes(candidate.name.toLowerCase()),
    );
    await ctx.runMutation(internal.crawls.addCandidates, {
      tripId: page.tripId,
      crawlPageId: page._id,
      candidates: extracted,
    });

    const anchors: Anchor[] = await ctx.runQuery(api.taste.listAnchors, {
      profileId: trip.profileId,
    });
    const remaining: Candidate[] = extracted.filter((candidate: Candidate) =>
      anchors.some((anchor: Anchor) =>
        categoryOverlap(anchor.categories, candidate.categories),
      ),
    );
    if (remaining.length === 0) {
      return { candidates: extracted.length, kept: 0, usedModel: false };
    }

    const scored: ScoreResult = await scoreAgainstAnchors(remaining, anchors);
    const austin = trip.city.trim().toLowerCase().includes("austin");
    let kept = 0;
    for (const row of scored.rows) {
      const name = austin
        ? austinAllowedName(row.candidate.name)
        : row.candidate.name;
      if (austin && name === null) continue;
      const wrote = await ctx.runMutation(internal.crawls.upsertMatch, {
        tripId: page.tripId,
        name: name ?? row.candidate.name,
        neighborhood: row.candidate.neighborhood,
        homePlaceName: row.anchor.name,
        score: row.score,
        whyLine: row.whyLine,
        vibeTag: row.tag,
        quote: row.quote,
        source: "crawl",
        sourceUrl: row.candidate.sourceUrl,
      });
      if (wrote) kept += 1;
    }
    return {
      candidates: extracted.length,
      kept,
      usedModel: scored.usedModel,
    };
  },
});

function austinAllowedName(name: string): string | null {
  if (name === "Epoch Coffee") return "Epoch Coffee, North Loop";
  if ((AUSTIN_MATCH_ORDER as readonly string[]).includes(name)) return name;
  return null;
}

async function scoreAgainstAnchors(
  candidates: Candidate[],
  anchors: Anchor[],
): Promise<ScoreResult> {
  const pairs: Array<{ candidate: Candidate; anchor: Anchor }> = [];
  for (const candidate of candidates) {
    for (const anchor of anchors) {
      if (categoryOverlap(anchor.categories, candidate.categories)) {
        pairs.push({ candidate, anchor });
      }
    }
  }

  const raw = await callModel(scorePrompt(pairs));
  const byName = new Map<string, Scored>();

  if (raw.ok) {
    const parsed = parseScores(raw.text);
    for (const pair of pairs) {
      const hit = parsed.find(
        (item) =>
          item.candidate.toLowerCase() === pair.candidate.name.toLowerCase() &&
          item.anchor.toLowerCase() === pair.anchor.name.toLowerCase(),
      );
      const quote = pickQuote(pair.candidate.snippet, hit?.quote);
      if (!quote) continue;
      const tag =
        hit?.tag && pair.anchor.vibeTags.includes(hit.tag)
          ? hit.tag
          : sharedTag(pair.anchor, pair.candidate);
      const score = clampScore(hit?.score ?? 0);
      consider(byName, {
        candidate: pair.candidate,
        anchor: pair.anchor,
        score,
        tag,
        quote,
        whyLine: buildWhyLine({
          anchor: pair.anchor.name,
          tag,
          candidate: pair.candidate.name,
          quote,
        }),
      });
    }
    return { rows: [...byName.values()], usedModel: true };
  }

  for (const pair of pairs) {
    const quote = pickQuote(pair.candidate.snippet);
    if (!quote) continue;
    const tag = sharedTag(pair.anchor, pair.candidate);
    const snippetLower = pair.candidate.snippet.toLowerCase();
    const tagHit = pair.anchor.vibeTags.some((item) =>
      snippetLower.includes(item.toLowerCase()),
    );
    const score = tagHit ? 7 : 0;
    consider(byName, {
      candidate: pair.candidate,
      anchor: pair.anchor,
      score,
      tag,
      quote,
      whyLine: buildWhyLine({
        anchor: pair.anchor.name,
        tag,
        candidate: pair.candidate.name,
        quote,
      }),
    });
  }
  return { rows: [...byName.values()], usedModel: false };
}

function consider(map: Map<string, Scored>, row: Scored) {
  if (row.score < 7) return;
  const current = map.get(row.candidate.name);
  if (!current || row.score > current.score) {
    map.set(row.candidate.name, row);
  }
}

function sharedTag(anchor: Anchor, candidate: Candidate): string {
  const hay = `${candidate.snippet} ${candidate.categories.join(" ")}`.toLowerCase();
  const hit = anchor.vibeTags.find((tag) => hay.includes(tag.toLowerCase()));
  return hit ?? anchor.vibeTags[0] ?? "usual";
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(10, Math.round(value)));
}

function scorePrompt(
  pairs: Array<{ candidate: Candidate; anchor: Anchor }>,
): string {
  const lines = pairs.map(
    (pair) =>
      `- CANDIDATE ${pair.candidate.name} | cats ${pair.candidate.categories.join(",")} | snippet: ${pair.candidate.snippet}\n  ANCHOR ${pair.anchor.name} | cats ${pair.anchor.categories.join(",")} | tags ${pair.anchor.vibeTags.join(",")} | why ${pair.anchor.note}`,
  );
  return `Score each candidate against each listed anchor from 1-10.
Hard rule: only use the given snippet. quote must be copied from that snippet.
tag must be one of the anchor tags.
Return JSON only: { "scores": [ { "candidate", "anchor", "score", "tag", "quote" } ] }

${lines.join("\n")}`;
}

function parseScores(text: string): Array<{
  candidate: string;
  anchor: string;
  score: number;
  tag: string;
  quote: string;
}> {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return [];
  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      scores?: Array<Record<string, unknown>>;
    };
    return (parsed.scores ?? []).map((item) => ({
      candidate: String(item.candidate ?? ""),
      anchor: String(item.anchor ?? ""),
      score: Number(item.score ?? 0),
      tag: String(item.tag ?? ""),
      quote: String(item.quote ?? ""),
    }));
  } catch {
    return [];
  }
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
      return {
        ok: true,
        text,
        model: "openai/gpt-4o-mini via Convex AI Gateway",
      };
    }
  } catch {
    // Gateway disabled — try OPENAI_API_KEY.
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
        temperature: 0.2,
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
