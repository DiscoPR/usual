# Hackathon log

- **Project:** Usual
- **Event:** Convex All Gas Hackathon (OpenAI, Firecrawl, AgentMail)
- **What it does:** Finds your usual spots in a city you are about to visit — taste list, public-list crawl, grounded matches, owner-approved email.
- **Live app:** not deployed
- **Repo:** none
- **Frontend:** Convex static hosting
- **Convex deployment:** not deployed
- **Components:** @convex-dev/static-hosting
- **Convex features:** schema, tables, indexes, queries, mutations, actions, HTTP actions, realtime queries
- **Auth:** none
- **AI models:** openai/gpt-4o-mini (via Convex AI Gateway when available)
- **Started:** 2026-09-02T00:26:00Z
- **Last updated:** 2026-09-02T00:40:00Z

## Log

### 2026-09-02 - 7b6f55c
Started Usual as a new Convex app in this repo. Night Desk and Stamped were rejected before any product code shipped; this tree is Usual only. Seeded Fort Lauderdale taste plus an Austin weekend trip with eight matches labeled demo, grounded in public Eater Austin / Visit Austin pages. Convex features: schema, indexes, queries, mutations, actions, HTTP actions (`convex/schema.ts`, `convex/taste.ts`, `convex/trips.ts`, `convex/crawl.ts`, `convex/match.ts`, `convex/mail.ts`, `convex/http.ts`). Registered components in `convex/convex.config.ts`: `@convex-dev/static-hosting`, plus Firecrawl (`@firecrawl/firecrawl-convex`) and AgentMail (`@agentmail/convex`) which the header field does not list because they are not `@convex-dev/*`. Auth skipped this pass. Live `*.convex.site` URL is not deployed — no Convex login in this environment. Deploy command: `npm run deploy` after `npx convex login`.

### 2026-09-02 - 67d16ea
Locked the match pipeline. Taste cards now store categories, vibe tags, price band, and optional URL; the profile is a rollup of those anchors. City crawls extract candidates only from markdown with a source URL and quote, then a Convex action scores each category-overlapping pair 1–10 and upserts matches as each page finishes. Why line is `you liked {anchor} because {tag} → {candidate} because {tag} — "{quote}"`. Scores below 7 are hidden. Demo Austin matches use this same shape and are labeled demo (`convex/taxonomy.ts`, `convex/match.ts`, `convex/crawl.ts`, `convex/schema.ts`).
