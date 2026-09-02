import { useAction, useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function Trip() {
  const { tripId } = useParams();
  const id = tripId as Id<"trips"> | undefined;
  const trip = useQuery(api.trips.get, id ? { tripId: id } : "skip");
  const matches = useQuery(api.crawls.listMatches, id ? { tripId: id } : "skip");
  const pages = useQuery(api.crawls.listPages, id ? { tripId: id } : "skip");
  const keys = useQuery(api.profile.integrationStatus);
  const crawl = useAction(api.crawl.refreshCity);
  const draft = useMutation(api.trips.draftFromMatches);
  const saveDraft = useMutation(api.trips.saveDraft);
  const send = useMutation(api.mail.sendTrip);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [to, setTo] = useState("");

  if (!id) return <p className="text-muted">Missing trip.</p>;
  if (trip === undefined || matches === undefined || pages === undefined) {
    return <p className="text-muted">Opening trip…</p>;
  }
  if (trip === null) {
    return <p className="text-muted">That trip is gone.</p>;
  }
  const resolvedId = trip._id;

  async function onCrawl() {
    setBusy("crawl");
    setNotice(null);
    try {
      const result = await crawl({ tripId: resolvedId });
      if (result.missingKey) {
        setNotice(
          "FIRECRAWL_API_KEY is missing. Demo excerpt stays. Not a successful crawl.",
        );
      } else {
        setNotice(
          `Crawled ${result.crawled} page(s), skipped ${result.skipped}.`,
        );
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Crawl failed.");
    } finally {
      setBusy(null);
    }
  }

  async function onDraft() {
    setBusy("draft");
    setNotice(null);
    await draft({ tripId: resolvedId });
    setNotice("Draft ready. Nothing sent.");
    setBusy(null);
  }

  async function onSend() {
    setBusy("send");
    setNotice(null);
    const result = await send({ tripId: resolvedId, to: to.trim() });
    setNotice(result.sent ? "Sent through AgentMail." : result.reason);
    setBusy(null);
  }

  return (
    <section className="space-y-6">
      <p>
        <Link to="/trips" className="text-accent underline">
          All trips
        </Link>
      </p>
      <div>
        <h1 className="font-serif text-3xl">{trip.city}</h1>
        <p className="text-muted">{trip.dateLabel}</p>
        {trip.matchNote ? (
          <p className="mt-3 border border-line bg-white/60 px-3 py-3 text-sm">
            {trip.matchNote}
          </p>
        ) : null}
        {trip.crawlError ? (
          <p className="mt-3 text-sm text-accent">{trip.crawlError}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          className="bg-ink px-4 py-3 text-paper disabled:opacity-50"
          disabled={busy !== null}
          onClick={() => void onCrawl()}
        >
          {busy === "crawl" ? "Crawling…" : "Crawl city lists"}
        </button>
        <button
          type="button"
          className="border border-ink px-4 py-3 disabled:opacity-50"
          disabled={busy !== null}
          onClick={() => void onDraft()}
        >
          Draft email
        </button>
      </div>
      {keys && !keys.firecrawl ? (
        <p className="text-sm text-muted">
          Firecrawl key not set. Crawl will not pretend to succeed.
        </p>
      ) : null}
      {notice ? <p className="text-sm">{notice}</p> : null}

      <div>
        <h2 className="font-serif text-xl">Matches</h2>
        {matches.length === 0 ? (
          <p className="mt-2 border border-line px-4 py-5 text-muted">
            No matches at 7 or above. Crawl a city, or open the seeded Austin
            trip.
          </p>
        ) : (
          <ol className="mt-3 space-y-3">
            {matches.map((match) => (
              <li
                key={match._id}
                className="border border-line bg-white/70 px-4 py-4"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-lg font-medium">{match.name}</p>
                  <p className="text-sm font-medium">{match.score}/10</p>
                </div>
                <p className="text-sm text-muted">{match.neighborhood}</p>
                <p className="mt-2 text-sm">
                  Matched: {match.homePlaceName}
                  {match.vibeTag ? ` · ${match.vibeTag}` : ""}
                </p>
                <p className="mt-2">{match.whyLine}</p>
                {match.sourceUrl ? (
                  <a
                    href={match.sourceUrl}
                    className="mt-2 inline-block text-sm text-accent underline break-all"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Source
                  </a>
                ) : null}
                <p className="mt-2 text-xs uppercase tracking-wide text-muted">
                  {match.source === "demo" ? "Demo · " : ""}
                  grounded · score hides below 7
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div>
        <h2 className="font-serif text-xl">Crawled pages</h2>
        {pages.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nothing crawled yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {pages.map((page) => (
              <li key={page._id} className="border border-line px-4 py-3">
                <p className="font-medium">{page.label}</p>
                <p className="text-xs text-muted break-all">{page.url}</p>
                <p className="mt-1 text-sm">
                  {page.status}
                  {page.skipReason ? ` — ${page.skipReason}` : ""}
                </p>
                {page.excerpt ? (
                  <p className="mt-2 line-clamp-4 text-sm text-muted">
                    {page.excerpt}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="font-serif text-xl">Send the list</h2>
        <textarea
          className="w-full border border-line bg-white px-3 py-2"
          rows={7}
          value={trip.emailDraft ?? ""}
          onChange={(event) =>
            void saveDraft({
              tripId: resolvedId,
              emailSubject: trip.emailSubject ?? `Your usual, in ${trip.city}`,
              emailDraft: event.target.value,
            })
          }
          placeholder="Draft the trip list first."
        />
        <label className="block">
          <span className="mb-1 block text-sm text-muted">
            Send to (only if AgentMail is connected)
          </span>
          <input
            className="w-full border border-line bg-white px-3 py-2"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            placeholder="traveler inbox"
            autoComplete="off"
          />
        </label>
        <button
          type="button"
          className="w-full bg-accent px-4 py-3 text-paper disabled:opacity-50"
          disabled={busy !== null || !trip.emailDraft}
          onClick={() => void onSend()}
        >
          {busy === "send" ? "Sending…" : "Send email"}
        </button>
        {keys && !keys.agentmail ? (
          <p className="text-sm text-muted">
            Send is gated until AgentMail is connected. Usual never auto-sends.
          </p>
        ) : null}
      </div>
    </section>
  );
}
