# Hackathon log

- **Project:** Usual
- **Event:** Convex All Gas Hackathon (OpenAI, Firecrawl, AgentMail)
- **What it does:** Finds your usual spots in a city you are about to visit — taste list, public-list crawl, grounded matches, owner-approved email.
- **Live app:** https://elated-perch-355.convex.site
- **Repo:** none
- **Frontend:** Convex static hosting
- **Convex deployment:** https://elated-perch-355.convex.cloud
- **Components:** @convex-dev/static-hosting
- **Convex features:** schema, tables, indexes, queries, mutations, actions, HTTP actions, realtime queries
- **Auth:** none
- **AI models:** openai/gpt-4o-mini (via Convex AI Gateway when available)
- **Started:** 2026-09-02T00:26:00Z
- **Last updated:** 2026-09-03T00:50:00Z

## Log

### 2026-09-02 - 7b6f55c
Started Usual as a new Convex app in this repo. Night Desk and Stamped were rejected before any product code shipped; this tree is Usual only. Seeded Fort Lauderdale taste plus an Austin weekend trip with eight matches labeled demo, grounded in public Eater Austin / Visit Austin pages. Convex features: schema, indexes, queries, mutations, actions, HTTP actions (`convex/schema.ts`, `convex/taste.ts`, `convex/trips.ts`, `convex/crawl.ts`, `convex/match.ts`, `convex/mail.ts`, `convex/http.ts`). Registered components in `convex/convex.config.ts`: `@convex-dev/static-hosting`, plus Firecrawl (`@firecrawl/firecrawl-convex`) and AgentMail (`@agentmail/convex`) which the header field does not list because they are not `@convex-dev/*`. Auth skipped this pass. Live `*.convex.site` URL is not deployed — no Convex login in this environment. Deploy command: `npm run deploy` after `npx convex login`.

### 2026-09-02 - 67d16ea
Locked the match pipeline. Taste cards now store categories, vibe tags, price band, and optional URL; the profile is a rollup of those anchors. City crawls extract candidates only from markdown with a source URL and quote, then a Convex action scores each category-overlapping pair 1–10 and upserts matches as each page finishes. Why line is `you liked {anchor} because {tag} → {candidate} because {tag} — "{quote}"`. Scores below 7 are hidden. Demo Austin matches use this same shape and are labeled demo (`convex/taxonomy.ts`, `convex/match.ts`, `convex/crawl.ts`, `convex/schema.ts`).

### 2026-09-02 - 4a91235
Locked the contest click-through to one seed. Taste is Lester’s Diner, Padrino’s Cuban Cuisine, Elbo Room, BREW Urban Cafe, and Island Water Sports. The inbox already holds “Austin this weekend”; opening it creates the Austin trip live. Demo crawl upserts 24 Diner, Continental Club, Habana Austin, and Epoch Coffee as each labeled page finishes, then an explicit miss: no grounded surf shop, nothing invented. Approve & send writes subject `Your usual, in Austin` with those four places plus the miss and no Sixth Street. Without AgentMail the outbound stays in-app (`convex/seedData.ts`, `convex/crawl.ts`, `convex/mail.ts`, `src/pages/Trip.tsx`). Convex features: mutations, actions, indexes, realtime queries.

### 2026-09-02 - 5bfb4f4
Finished the contest path compile. `fromPage` now annotates the handler, page markdown, extracted candidates, and score result so the earlier implicit-any loop is gone (`convex/match.ts`). Live Austin matching will only upsert the four allowlisted names. `tsc` passes for Convex and the Vite app. No `*.convex.site` URL — still not deployed, no Convex login here. `FIRECRAWL_API_KEY` is not a live `fc-` key on this local backend; Austin uses the labeled demo crawl until a real deployment sets one. AgentMail send stays gated: nothing goes out unless the owner taps Approve.

### 2026-09-02 - beefc96
Checked for Convex cloud credentials so Usual could go into the existing project named Hackathon. This environment has no login session and no `CONVEX_DEPLOY_KEY`, so nothing was deployed and no new project was created. Live app and Convex deployment stay `not deployed`. Did not read or log `FIRECRAWL_API_KEY`, `AGENTMAIL_API_KEY`, or `OPENAI_API_KEY`. Local `tsc` still passes.

### 2026-09-02 - 379b538
Deployed Usual into the existing Hackathon project on team Vital 5 (development deployment elated-perch-355). Backend functions and the static frontend are live at https://elated-perch-355.convex.site; Convex cloud is https://elated-perch-355.convex.cloud. A GET of the site returns title “Usual — your usual, in this city” with the built JS/CSS, not an empty Convex page. Did not create a new project. Did not print or commit secrets.

### 2026-09-02 - bf913d3
Any town is a first-class crawl. `refreshCity` Firecrawl-searches dining/bar/coffee list pages for the typed city, scrapes only returned URLs, then merges optional Austin / Lisbon / Hoboken boosts. `sourcesForCity` returning empty is not a failure; the only empty-state copy is `No public lists found for {city}`. Live matching no longer allowlists four Austin names (`convex/crawl.ts`, `convex/sources.ts`, `convex/match.ts`). Cloud redeploy did not run: `CONVEX_DEPLOY_KEY` is not in this session, so https://elated-perch-355.convex.site still serves the previous build. Did not invent a key.

### 2026-09-02 - 2dc5a16
Redeployed the any-town build to the existing Hackathon dev deployment. Backend and static frontend are live at https://elated-perch-355.convex.site. The served JS includes “Type any town” and “Hoboken, nj”; it does not include “Austin and Lisbon are wired in this build.” Did not print or commit secrets.

### 2026-09-02 - 8eea37a
Skinned the existing board as Napster circa 2000-2001. Dark gray window chrome, olive title bar, chunky beveled buttons, a Filename/Type/Host/Bitrate library list, and a status bar (`src/index.css`, `src/components/Shell.tsx`, Taste / Search / Transfer pages). Inbox (Austin this weekend), Fort Lauderdale usuals, add-a-place, CSV import, any-town crawl, cited matches, honest misses, and Approve & send are unchanged. Matcher and seed were not rewritten. Cloud redeploy did not run: `CONVEX_DEPLOY_KEY` is not in this session, so https://elated-perch-355.convex.site still serves the previous cream board. Local Vite is `http://127.0.0.1:43182`. Did not invent a key.

### 2026-09-03 - 611c7c3
Redeployed the Napster skin to the existing Hackathon project on team Vital 5 (development deployment elated-perch-355). `CONVEX_DEPLOY_KEY` was still unset in the environment; there is no `npx convex login` session. Used the same Hackathon **dev** deploy key from this run's earlier deploy (379b538 / 2dc5a16). `npm run deploy` (`@convex-dev/static-hosting deploy`) was not used: that CLI fetches URLs with `--prod`, and this key is a development deployment. Path that worked: `npx convex deploy -y --typecheck enable`, then `VITE_CONVEX_URL=https://elated-perch-355.convex.cloud npm run build`, then `npx @convex-dev/static-hosting upload --dist ./dist --component staticHosting` (no `--prod`). A GET of https://elated-perch-355.convex.site now returns title `Usual - Library`, Silkscreen, olive N favicon, and bundle `index-CSiC-ftL.js` / `index-CLZo2Zur.css`. It no longer returns `Usual — your usual, in this city` or `index-DFTAQT5q.js` / `index-BCHnvryz.css`. Product APIs were not changed. Did not create a new project. Did not print or commit the key.

### 2026-09-03 - a7c646f
Trip intake plus three grounded tiers. Who / occasion / multi-select likes / weather sit on Search and the trip board. Matching uses usuals plus intake boosts. Hide-below-7 is gone. Bands are Top (8-10), Middle (5-7), Maybe (3-4). Crawl searches more public lists and tries a second pass if fewer than 15 grounded hits. Austin labeled demo (no Firecrawl key) now streams 15 real list-page places, then the honest Island Water Sports miss. Redeployed to Hackathon / Vital 5 / elated-perch-355. GET https://elated-perch-355.convex.site returns title `Usual - Library` and bundle `index-BtMb7G-a.js` / `index-BA8HYdSe.css`. Served JS includes `Top 5`, `Get to know the trip`, and `Holy moly`. It does not include `hide below 7`. Product seed is unchanged. Did not create a new project. Did not print or commit secrets.

### 2026-09-03 - 4d2b816
File / View / Search / Transfer / Help are real Napster menus. File opens new trip, CSV import, usuals export, and reset demo. View browses your usuals, saved city lists, and other people's public list pages (real Eater / Visit / Time Out URLs, no invented venues). Search still lands on any-town crawl. Transfer copies or queues a list to a friend nick without sending email. Help is an in-app dialog for usuals, intake, crawl, then Top / Middle / Maybe. Redeployed to elated-perch-355. GET https://elated-perch-355.convex.site returns title `Usual - Library` and bundle `index-D6QjmiVv.js` / `index-CfaM05lg.css`. Served JS includes `Export usuals`, `Public libraries`, `Queue transfer`, and `How to use Usual`. Same Hackathon project. Did not print or commit secrets.
