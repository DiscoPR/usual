import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const autoStarted = new Set<string>();

export function Trip() {
  const { tripId } = useParams();
  const id = tripId as Id<"trips"> | undefined;
  const trip = useQuery(api.trips.get, id ? { tripId: id } : "skip");
  const matches = useQuery(api.crawls.listMatches, id ? { tripId: id } : "skip");
  const pages = useQuery(api.crawls.listPages, id ? { tripId: id } : "skip");
  const thread = useQuery(api.mail.listForTrip, id ? { tripId: id } : "skip");
  const keys = useQuery(api.profile.integrationStatus);
  const crawl = useAction(api.crawl.refreshCity);
  const draft = useMutation(api.trips.draftFromMatches);
  const saveDraft = useMutation(api.trips.saveDraft);
  const send = useMutation(api.mail.sendTrip);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [to, setTo] = useState("");

  useEffect(() => {
    if (!trip) return;
    if (trip.origin !== "email") return;
    if (trip.crawlStatus !== "idle") return;
    if (autoStarted.has(trip._id)) return;
    autoStarted.add(trip._id);
    setBusy("crawl");
    void crawl({ tripId: trip._id })
      .then((result) => {
        if (result.demo) {
          setNotice("Labeled demo crawl. Matches arrived page by page.");
        } else if (result.missingKey) {
          setNotice("FIRECRAWL_API_KEY is missing for this city.");
        } else {
          setNotice(
            `Crawled ${result.crawled} page(s), skipped ${result.skipped}.`,
          );
        }
      })
      .catch((err: unknown) => {
        setNotice(err instanceof Error ? err.message : "Crawl failed.");
      })
      .finally(() => setBusy(null));
  }, [trip, crawl]);

  if (!id) return <p className="text-muted">Missing trip.</p>;
  if (trip === undefined || matches === undefined || pages === undefined) {
    return <p className="text-muted">Opening trip…</p>;
  }
  if (trip === null) {
    return <p className="text-muted">That trip is gone.</p>;
  }
  const resolvedId = trip._id;
  const crawling =
    trip.crawlStatus === "crawling" ||
    trip.status === "crawling" ||
    trip.status === "matching" ||
    (trip.crawlStatus === "demo" && trip.status !== "ready" && trip.status !== "sent");

  async function onCrawl() {
    setBusy("crawl");
    setNotice(null);
    try {
      const result = await crawl({ tripId: resolvedId });
      if (result.demo) {
        setNotice("Labeled demo crawl. Matches arrived page by page.");
      } else if (result.missingKey) {
        setNotice("FIRECRAWL_API_KEY is missing. No labeled demo for this city.");
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
    const result = await send({
      tripId: resolvedId,
      to: to.trim() || undefined,
    });
    setNotice(
      result.reason ??
        (result.sent ? "Sent through AgentMail." : "Send did not go out."),
    );
    setBusy(null);
  }

  const outbound = (thread ?? []).filter(
    (row) => row.direction === "outbound",
  );

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
          disabled={busy !== null || crawling}
          onClick={() => void onCrawl()}
        >
          {busy === "crawl" || crawling
            ? "Crawling…"
            : "Crawl city lists"}
        </button>
        <p className="text-xs uppercase tracking-wide text-muted">
          Firecrawl search · scrape returned URLs · pages land live
        </p>
        <button
          type="button"
          className="border border-ink px-4 py-3 disabled:opacity-50"
          disabled={busy !== null}
          onClick={() => void onDraft()}
        >
          Draft email
        </button>
      </div>
      {notice ? <p className="text-sm">{notice}</p> : null}

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-xl">Matches</h2>
          <span className="text-xs uppercase tracking-wide text-muted">
            OpenAI · hide below 7
          </span>
        </div>
        {matches.length === 0 ? (
          <p className="mt-2 border border-line px-4 py-5 text-muted">
            {crawling
              ? "Waiting on the first page…"
              : "No matches yet. Search public lists for this town."}
          </p>
        ) : (
          <ol className="mt-3 space-y-3">
            {matches.map((match) =>
              match.isMiss ? (
                <li
                  key={match._id}
                  className="border border-accent/40 bg-white/70 px-4 py-4"
                >
                  <p className="text-xs uppercase tracking-wide text-accent">
                    Explicit miss
                  </p>
                  <p className="mt-1 text-lg font-medium">{match.name}</p>
                  <p className="mt-2">{match.whyLine}</p>
                </li>
              ) : (
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
                  {match.quote ? (
                    <blockquote className="mt-2 border-l-2 border-line pl-3 text-sm text-muted">
                      “{match.quote}”
                    </blockquote>
                  ) : null}
                  {match.sourceUrl ? (
                    <a
                      href={match.sourceUrl}
                      className="mt-2 inline-block text-sm text-accent underline break-all"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {match.sourceUrl}
                    </a>
                  ) : null}
                  <p className="mt-2 text-xs uppercase tracking-wide text-muted">
                    {match.source === "demo" ? "demo · " : "crawled · "}
                    matched
                  </p>
                </li>
              ),
            )}
          </ol>
        )}
      </div>

      <div>
        <h2 className="font-serif text-xl">Crawled pages</h2>
        {pages.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            {crawling ? "First page in flight…" : "Nothing crawled yet."}
          </p>
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
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-xl">Approve & send</h2>
          <span className="text-xs uppercase tracking-wide text-muted">
            AgentMail
          </span>
        </div>
        <p className="text-sm font-medium">
          {trip.emailSubject ?? "Draft the list first."}
        </p>
        <textarea
          className="w-full border border-line bg-white px-3 py-2"
          rows={10}
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
        {keys?.agentmail ? (
          <label className="block">
            <span className="mb-1 block text-sm text-muted">Send to</span>
            <input
              className="w-full border border-line bg-white px-3 py-2"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              placeholder="traveler inbox"
              autoComplete="off"
            />
          </label>
        ) : (
          <p className="text-sm text-muted">
            AgentMail is not connected. Approve still writes the outbound here.
            Nothing leaves the machine.
          </p>
        )}
        <button
          type="button"
          className="w-full bg-accent px-4 py-3 text-paper disabled:opacity-50"
          disabled={busy !== null || !trip.emailDraft || trip.status === "sent"}
          onClick={() => void onSend()}
        >
          {busy === "send"
            ? "Sending…"
            : trip.status === "sent"
              ? "Sent"
              : "Approve & send"}
        </button>
      </div>

      {outbound.length > 0 ? (
        <div className="space-y-3">
          <h2 className="font-serif text-xl">Outbound</h2>
          {outbound.map((row) => (
            <article
              key={row._id}
              className="border border-line bg-white/80 px-4 py-4"
            >
              <p className="text-xs uppercase tracking-wide text-muted">
                {row.status === "simulated" ? "demo send" : row.status}
              </p>
              <p className="mt-1 font-medium">{row.subject}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{row.body}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
