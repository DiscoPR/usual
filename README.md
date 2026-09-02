# Usual

Your usual, in this city.

Usual is a phone-first trip board. You keep a short list of home-city places you already love. You name a destination. Usual crawls a few public city lists, matches them to your taste, and drafts an email. Sending is an explicit tap. Nothing goes out on its own.

Demo seed: Fort Lauderdale / South Florida usuals, plus an Austin weekend trip with eight grounded-looking matches labeled as demo.

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

Seed runs on first load (`ensureDemo`). Judges can click Taste → Trips → Austin with no keys.

## Environment variable names

Set these on the Convex deployment. Values stay out of the repo.

| Name | Used for |
| --- | --- |
| `FIRECRAWL_API_KEY` | Live city-list crawls. The Firecrawl component requires this name to be set. A real key starts with `fc-`. Anything else is treated as missing — crawl will not fake success. |
| `FIRECRAWL_WEBHOOK_SECRET` | Optional Firecrawl webhook signing |
| `AGENTMAIL_API_KEY` | Inbox + outbound send |
| `AGENTMAIL_WEBHOOK_SECRET` | Signed inbound webhook |
| `AGENTMAIL_INBOX_ID` | Inbox used for owner-approved send |
| `OPENAI_API_KEY` | Fallback if Convex AI Gateway is unavailable |

If a key is missing, the UI says so. Crawl does not fake success. Send stays gated. Matches fall back to the labeled demo / placeholder path.

## Deploy to convex.site

```bash
npx convex login
npm run deploy
```

`npm run deploy` runs `@convex-dev/static-hosting deploy` (build + Convex push + upload `dist/`, SPA routing on). The live URL is `https://<deployment>.convex.site`.

AgentMail webhook path: `https://<deployment>.convex.site/agentmail/webhook`

## Demo path (under 3 minutes)

1. Taste — five seeded South Florida usuals. Add one if you want.
2. Trips — open **Austin, this weekend**.
3. Trip — eight demo matches already on the board. Tap **Crawl city lists** (needs a Firecrawl key; otherwise it stays demo). Tap **Draft email**, then **Send email** (gated without AgentMail).

## Public sources (verified)

Austin:

- https://austin.eater.com/maps/best-restaurants-austin-eater-38
- https://www.austinchronicle.com/food/
- https://www.austintexas.org/food-and-drink/

Lisbon:

- https://www.timeout.com/lisbon/restaurants
- https://www.visitlisboa.com/en

A 404 is skipped. No invented dead URLs.

## Out of scope

Google Takeout ZIP parsing, Google Maps scraping, SMS, payments, auth, and any other product this repo started as.
