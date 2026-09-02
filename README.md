# Usual

Your usual, in this city.

Usual keeps a short list of home-city places you already love, crawls a few public lists in the city you are visiting, and drafts an email of grounded matches. Sending is an explicit tap. Nothing goes out on its own.

Contest demo seed (Fort Lauderdale → Austin this weekend):

- Taste: Lester’s Diner, Padrino’s Cuban Cuisine, Elbo Room, BREW Urban Cafe, Island Water Sports
- Inbox: subject `Austin this weekend`. Opening it creates the Austin trip live.
- Matches (only these): 24 Diner, Continental Club, Habana Austin, Epoch Coffee, North Loop — plus an explicit miss for Island Water Sports: “No grounded surf shop in this crawl. We didn’t make one up.”
- Outbound subject: `Your usual, in Austin`. No Sixth Street.

## Stack

- Convex (database, queries, mutations, actions, live subscriptions)
- Firecrawl Convex component (`@firecrawl/firecrawl-convex`)
- AgentMail Convex component (`@agentmail/convex`)
- OpenAI via Convex AI Gateway (`openai/gpt-4o-mini`) or `OPENAI_API_KEY`
- Frontend on `@convex-dev/static-hosting` (`*.convex.site`)

No Vercel. No Supabase. No Replit. No auth in this first pass.

## Run locally

```bash
npm install
npx convex dev
```

In a second terminal:

```bash
npm run dev
```

The Vite app listens on `http://127.0.0.1:43182`.

`npx convex dev` writes `VITE_CONVEX_URL`. If the UI says the Convex URL is missing, restart Vite after the backend is up.

Seed runs on first load (`ensureDemo`). Judges can click Taste → inbox → Austin with no keys. Without a Firecrawl key, Austin uses a labeled demo crawl that still upserts matches page by page.

## Environment variable names

Set these on the Convex deployment. Values stay out of the repo.

| Name | Used for |
| --- | --- |
| `FIRECRAWL_API_KEY` | Live city-list crawls. The Firecrawl component requires this name to be set. A real key starts with `fc-`. Anything else is treated as missing. Austin then uses the labeled demo crawl. |
| `FIRECRAWL_WEBHOOK_SECRET` | Optional Firecrawl webhook signing |
| `AGENTMAIL_API_KEY` | Inbox + outbound send |
| `AGENTMAIL_WEBHOOK_SECRET` | Signed inbound webhook |
| `AGENTMAIL_INBOX_ID` | Inbox used for owner-approved send |
| `OPENAI_API_KEY` | Fallback if Convex AI Gateway is unavailable |

Send never auto-fires. Without AgentMail, **Approve & send** writes an in-app outbound (demo send).

## Deploy to convex.site

Deploy into the existing Convex cloud project named **Hackathon**. Do not create a differently named project.

```bash
npx convex login
npm run deploy
```

`npm run deploy` runs `@convex-dev/static-hosting deploy` (build + Convex push + upload `dist/`, SPA routing on). The live URL is `https://<deployment>.convex.site`.

AgentMail webhook path: `https://<deployment>.convex.site/agentmail/webhook`

## Matching method

1. **Taste card** — name, city, optional URL, one-line why. Why (or a Firecrawl of the URL) fills `categories[]`, `vibeTags[]`, `priceBand`. The profile is the rollup of 5–12 anchors.
2. **City crawl** — Firecrawl verified public list pages. Candidates are extracted from markdown only, each with a source URL and a quoted snippet. Names not in the crawl text are dropped.
3. **Match** — hard filter: candidate category must overlap an anchor category. A Convex action scores each remaining pair 1–10 (OpenAI, or a rule score if no model). Quote must come from the snippet. Why line: `you liked {anchor} because {tag} → {candidate} because {tag} — "{quote}"`. Best score per candidate. Hide below 7. Results upsert as each page finishes so the board moves live. Invented venues are never shown. An anchor with no grounded candidate is an explicit miss.

## Demo path (under 3 minutes)

1. Taste — five seeded South Florida usuals, plus the inbound email already in the inbox.
2. Open **Austin this weekend**. The Austin trip is created live.
3. Matches land one page at a time: 24 Diner, Epoch Coffee, Continental Club, Habana Austin, then the Island Water Sports miss.
4. **Approve & send** — subject `Your usual, in Austin`. Four places + the miss. No Sixth Street.

## Public sources (verified)

Austin (demo / live crawl):

- https://austin.eater.com/maps/best-24-hour-restaurants-austin-cafes-diners-all-hours-24-7
- https://austin.eater.com/maps/south-congress-austin-best-restaurants-bars-dining-guide-where-to-eat-travis-heights-bouldin-creek
- https://www.habanaaustin.com/
- https://epochcoffee.com/

Lisbon:

- https://www.timeout.com/lisbon/restaurants
- https://www.visitlisboa.com/en

A 404 is skipped. No invented dead URLs. The demo seed does not invent extra Austin venues.

## Out of scope

Google Takeout ZIP parsing, Google Maps scraping, SMS, payments, auth, and any other product this repo started as.
