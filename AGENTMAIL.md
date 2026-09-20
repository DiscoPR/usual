# AgentMail reconnect (elated-perch-355)

Cold-check on https://elated-perch-355.convex.site showed **AgentMail is not connected**. Approve & send still works as an in-app demo send. This note is names only. No secret values.

## How the UI decides "connected"

`api.profile.integrationStatus` (`convex/profile.ts`) sets `agentmail: true` only when **both** of these Convex environment variables are non-empty on **this** deployment:

- `AGENTMAIL_API_KEY`
- `AGENTMAIL_INBOX_ID`

If either is missing, Search shows "AgentMail is not connected" and the trip board says Approve writes outbound in-app. Nothing leaves the machine.

A real AgentMail send (`convex/mail.ts` `sendTrip`) also needs a recipient: the Send to field, or optional `AGENTMAIL_DEFAULT_TO`. Keys without a recipient still complete the loop in-app.

Inbound live mail uses the HTTP route already mounted at `/agentmail/webhook` (`convex/http.ts`). The component verifies the Svix signature with `AGENTMAIL_WEBHOOK_SECRET`. That secret is **not** part of the connected boolean. Without it, inbound webhooks fail even if the UI says connected.

## Target

- Team: **Vital 5**
- Project: **Hackathon**
- Deployment: **elated-perch-355** (development)
- Dashboard: https://dashboard.convex.dev/t/vital/hackathon/elated-perch-355
- Settings → Environment Variables (this deployment, not a new project)

This agent cannot set dashboard secrets from here. Kevin pastes the values.

## What Kevin pastes in Convex Settings → Environment Variables

Create or update these **names** on elated-perch-355:

| Name | Required for | Where the value comes from |
| --- | --- | --- |
| `AGENTMAIL_API_KEY` | UI "connected" + outbound send | AgentMail console API key |
| `AGENTMAIL_INBOX_ID` | UI "connected" + outbound send | The Usual inbox id (AgentMail uses the inbox email address, e.g. `something@agentmail.to`) |
| `AGENTMAIL_WEBHOOK_SECRET` | Live inbound webhook verify | Signing secret shown once when you create the webhook. Starts with `whsec_` |
| `AGENTMAIL_DEFAULT_TO` | Optional | Judge or Kevin inbox so Approve & send can go out without typing Send to |

Do not invent keys. Do not put values in git.

## AgentMail console (yes, create an inbox if you do not have one)

1. Open https://console.agentmail.to (or https://agentmail.to) and sign in.
2. Copy an API key into `AGENTMAIL_API_KEY`.
3. Create an inbox if none exists (display name `Usual` is fine). Copy that inbox id into `AGENTMAIL_INBOX_ID`.
4. Create a webhook:
   - Endpoint URL: `https://elated-perch-355.convex.site/agentmail/webhook`
   - Event: `message.received`
   - Scope it to the Usual inbox if the UI allows inbox ids
5. Copy the webhook signing secret into `AGENTMAIL_WEBHOOK_SECRET`.
6. Save the Convex env vars. Queries read env on the next call. A function redeploy is not required just to pick up new env values. Hard-refresh the live site.

## How to verify in the UI

1. Open https://elated-perch-355.convex.site
2. Search tab: the Email a trip hint should say **Inbox is connected**, not **AgentMail is not connected**.
3. Open an Austin trip with grounded matches. Approve & send hint should say **AgentMail is connected**.
4. Fill Send to (or rely on `AGENTMAIL_DEFAULT_TO`) and tap Approve & send. Outbound should say `sent`, not only `demo send`.
5. Optional inbound check: email the AgentMail inbox with subject `Austin this weekend`. The Library inbox should get a live row after the webhook fires.

If the UI still says not connected, one of `AGENTMAIL_API_KEY` or `AGENTMAIL_INBOX_ID` is empty on **this** deployment (wrong project, or prod vs dev). Confirm you edited Hackathon / elated-perch-355.
