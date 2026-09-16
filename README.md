# Usual

Email a city. Get your usuals there, grounded, or an honest miss.

Usual keeps a short list of home-city places you already love, crawls public lists in the city you are visiting, and drafts an email of cited matches. Sending is an explicit tap. Nothing goes out on its own.

Live app: https://elated-perch-355.convex.site

The board is skinned as Napster circa 2000: dark gray window chrome, olive accents, beveled buttons, a library list, and a status bar.

Contest demo seed (Fort Lauderdale → Austin this weekend):

- Taste: Lester’s Diner, Padrino’s Cuban Cuisine, Elbo Room, BREW Urban Cafe, Island Water Sports
- Inbox: subject `Austin this weekend`. Opening it creates the Austin trip live.
- Matches: cited Top / Middle / Maybe from public list pages, plus an explicit miss for Island Water Sports: “No grounded surf shop in this crawl. We didn't make one up.”
- Outbound subject: `Your usual, in Austin`. No Sixth Street.

## Sponsor map

| Sponsor | What it does in Usual |
| --- | --- |
| **Convex** | Board, trip state, matches, realtime crawl cards, mutations, actions, static hosting on `*.convex.site` |
| **AgentMail** | Trip inbox (`Austin this weekend`) and Approve & send outbound |
| **Firecrawl** | Search + scrape of public city lists. Source URL and quote on every match card |
| **OpenAI** | Taste match (`openai/gpt-4o-mini` via Convex AI Gateway, or `OPENAI_API_KEY`) |

No Vercel. No auth on the demo path.

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

Seed runs on first load (`ensureDemo`). Judges can click Taste → inbox → Austin with no keys. Without a Firecrawl key, Austin uses a labeled demo crawl that still streams real list-page places, then the honest surf miss.

## Environment variable names

Set these on the Convex deployment. Values stay out of the repo.

| Name | Used for |
| --- | --- |
| `FIRECRAWL_API_KEY` | Live city-list crawls. A real key starts with `fc-`. Anything else is treated as missing. Austin then uses the labeled demo crawl. |
| `FIRECRAWL_WEBHOOK_SECRET` | Optional Firecrawl webhook signing |
| `AGENTMAIL_API_KEY` | Inbox + outbound send |
| `AGENTMAIL_WEBHOOK_SECRET` | Signed inbound webhook |
| `AGENTMAIL_INBOX_ID` | Inbox used for owner-approved send |
| `AGENTMAIL_DEFAULT_TO` | Optional default recipient when Approve & send has an empty Send to field |
| `OPENAI_API_KEY` | Fallback if Convex AI Gateway is unavailable |

Send never auto-fires. After grounded matches land, Approve & send stays clickable. With AgentMail keys and a recipient, it sends for real. Without keys (or without a recipient), it still writes an in-app outbound so the demo loop finishes.

## Deploy to convex.site

Deploy into the existing Convex cloud project named **Hackathon** on team Vital 5 (development deployment `elated-perch-355`). Do not create a differently named project.

This is a **development** deployment. `@convex-dev/static-hosting deploy` may fetch with `--prod`, which is the wrong target here.

Working path:

```bash
# 1. Push functions to the Hackathon dev deployment
npx convex deploy -y --typecheck enable

# 2. Build the frontend against the cloud URL
VITE_CONVEX_URL=https://elated-perch-355.convex.cloud npm run build

# 3. Upload static files (no --prod)
npx @convex-dev/static-hosting upload --dist ./dist --component staticHosting
```

If `.env.local` points at a local anonymous deployment, move it aside for that cloud deploy so it does not win.

Live app: https://elated-perch-355.convex.site  
Convex cloud: https://elated-perch-355.convex.cloud  
AgentMail webhook: `https://elated-perch-355.convex.site/agentmail/webhook`

## Matching method

1. **Taste row** - name, city, optional URL, one-line why. Why (or a Firecrawl of the URL) fills `categories[]`, `vibeTags[]`, `priceBand`.
2. **City crawl** - Firecrawl search for public dining/bar/coffee lists. Known Austin list pages are pinned first. Only returned URLs plus those boosts are scraped. Candidates come from markdown only, each with a source URL and a quoted snippet. If search and boosts are empty: `No verified public sources for {city}`. Hoboken is off the filmed path; Austin is the demo city. Thin Austin live crawls fall back to the labeled demo pages (real public lists, nothing invented).
3. **Match** - hard filter: candidate category overlaps an anchor, or the trip intake. A Convex action scores each pair 1-10, then intake boosts nightlife, trails, indoor rooms, and so on. Quote comes from the snippet. Tiers: Top (8-10), Middle (5-7), Maybe (3-4). An anchor with no grounded candidate (a surf shop in Austin) is an explicit miss.

## Demo path (under 3 minutes)

1. Library - five seeded South Florida usuals, plus the inbound email already in the inbox.
2. Open **Austin this weekend**. The Austin trip is created live.
3. Matches land in three tiers. Each card shows a Firecrawl quote and source URL. Island Water Sports is an honest miss.
4. **Approve & send** - subject `Your usual, in Austin`. Grounded places + the miss. No Sixth Street.

## Submit notes (All Gas, due Tue Sep 22 2026 12:00 PM PT)

- Live URL must stay on `*.convex.site` (this repo already uses Convex static hosting).
- Public GitHub is required at submit. This Origin repo is not a substitute. Do not invent a GitHub URL here if none exists yet.
- `hackathon.md` at the repo root is the build log judges read.
- Video demo under 3 minutes, filmed on the live URL. Recording is out of scope for this tree.
- Submit on vibeapps.dev with tag `AllGasHackathon`. Register on Luma. Kevin owns GitHub / Luma / vibeapps / the video.

## Out of scope

Google Takeout ZIP parsing, Google Maps scraping, SMS, payments, auth, and any other product this repo started as.
