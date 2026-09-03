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

  if (!id) return <p className="empty">Missing trip.</p>;
  if (trip === undefined || matches === undefined || pages === undefined) {
    return <p className="empty">Opening trip...</p>;
  }
  if (trip === null) {
    return <p className="empty">That trip is gone.</p>;
  }
  const resolvedId = trip._id;
  const crawling =
    trip.crawlStatus === "crawling" ||
    trip.status === "crawling" ||
    trip.status === "matching" ||
    (trip.crawlStatus === "demo" &&
      trip.status !== "ready" &&
      trip.status !== "sent");

  async function onCrawl() {
    setBusy("crawl");
    setNotice(null);
    try {
      const result = await crawl({ tripId: resolvedId });
      if (result.demo) {
        setNotice("Labeled demo crawl. Matches arrived page by page.");
      } else if (result.missingKey) {
        setNotice(
          "FIRECRAWL_API_KEY is missing. No labeled demo for this city.",
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

  const outbound = (thread ?? []).filter((row) => row.direction === "outbound");
  const hits = matches.filter((match) => !match.isMiss);
  const misses = matches.filter((match) => match.isMiss);

  return (
    <>
      <div className="trip-top">
        <Link to="/trips" className="btn-win">
          « Search
        </Link>
        <h1 className="trip-title">{trip.city}</h1>
        <span className="badge">{trip.dateLabel}</span>
        <span className="badge">{trip.status}</span>
      </div>

      {trip.matchNote ? (
        <section className="pane">
          <p className="pane-pad">{trip.matchNote}</p>
        </section>
      ) : null}
      {trip.crawlError ? <p className="err">{trip.crawlError}</p> : null}

      <div className="xfer-row">
        <button
          type="button"
          className="btn-go"
          disabled={busy !== null || crawling}
          onClick={() => void onCrawl()}
        >
          {busy === "crawl" || crawling ? "Crawling..." : "Crawl city lists"}
        </button>
        <button
          type="button"
          className="btn-win"
          disabled={busy !== null}
          onClick={() => void onDraft()}
        >
          Draft email
        </button>
      </div>
      <p className="hint">
        Firecrawl search · scrape returned URLs · pages land live
      </p>
      {notice ? <p className="ok">{notice}</p> : null}

      <section className="pane">
        <div className="section-head">
          Download / matches
          <span className="count">
            {hits.length} hits · hide below 7
          </span>
        </div>
        {hits.length === 0 ? (
          <p className="empty">
            {crawling
              ? "Waiting on the first page..."
              : "No matches yet. Search public lists for this town."}
          </p>
        ) : (
          <div className="lib">
            <div className="lib-head">
              <span>Filename</span>
              <span>Type</span>
              <span>Host</span>
              <span>Bitrate</span>
            </div>
            {hits.map((match) => (
              <div key={match._id} className="lib-row">
                <span className="lib-name">{match.name}</span>
                <span>{match.score}/10</span>
                <span>{match.neighborhood || trip.city}</span>
                <span>{match.source === "demo" ? "demo" : "crawl"}</span>
                <span className="lib-why">
                  Matched: {match.homePlaceName}
                  {match.vibeTag ? ` · ${match.vibeTag}` : ""}
                </span>
                <span className="lib-why">{match.whyLine}</span>
                {match.quote ? (
                  <span className="lib-quote">"{match.quote}"</span>
                ) : null}
                {match.sourceUrl ? (
                  <span className="lib-skip">
                    <a
                      href={match.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {match.sourceUrl}
                    </a>
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {misses.length > 0 ? (
        <section className="pane">
          <div className="section-head">
            Unavailable
            <span className="count">{misses.length} miss</span>
          </div>
          {misses.map((match) => (
            <p key={match._id} className="miss-line">
              <strong>{match.name}.</strong> {match.whyLine}
            </p>
          ))}
        </section>
      ) : null}

      <section className="pane">
        <div className="section-head">
          Hosts / crawl
          <span className="count">{pages.length}</span>
        </div>
        {pages.length === 0 ? (
          <p className="empty">
            {crawling ? "First page in flight..." : "Nothing crawled yet."}
          </p>
        ) : (
          <div className="lib">
            <div className="lib-head">
              <span>Filename</span>
              <span>Type</span>
              <span>Host</span>
              <span>Bitrate</span>
            </div>
            {pages.map((page) => (
              <div
                key={page._id}
                className={`lib-row${page.skipReason ? " lib-row-miss" : ""}`}
              >
                <span className="lib-name">{page.label}</span>
                <span>{page.status}</span>
                <span>{page.url}</span>
                <span>{page.skipReason ? "skip" : "ok"}</span>
                {page.skipReason ? (
                  <span className="lib-skip">{page.skipReason}</span>
                ) : null}
                {page.excerpt ? (
                  <span className="lib-quote">{page.excerpt}</span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="pane">
        <div className="section-head">
          Approve & send
          <span className="count">AgentMail</span>
        </div>
        <div className="form-stack">
          <p className="hint">{trip.emailSubject ?? "Draft the list first."}</p>
          <textarea
            className="field"
            rows={10}
            value={trip.emailDraft ?? ""}
            onChange={(event) =>
              void saveDraft({
                tripId: resolvedId,
                emailSubject:
                  trip.emailSubject ?? `Your usual, in ${trip.city}`,
                emailDraft: event.target.value,
              })
            }
            placeholder="Draft the trip list first."
          />
          {keys?.agentmail ? (
            <label>
              <span>Send to</span>
              <input
                className="field"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                placeholder="traveler inbox"
                autoComplete="off"
              />
            </label>
          ) : (
            <p className="hint">
              AgentMail is not connected. Approve still writes the outbound
              here. Nothing leaves the machine.
            </p>
          )}
          <button
            type="button"
            className="btn-go"
            disabled={busy !== null || !trip.emailDraft || trip.status === "sent"}
            onClick={() => void onSend()}
          >
            {busy === "send"
              ? "Sending..."
              : trip.status === "sent"
                ? "Sent"
                : "Approve & send"}
          </button>
        </div>
      </section>

      {outbound.length > 0 ? (
        <section className="pane">
          <div className="section-head">Outbound</div>
          {outbound.map((row) => (
            <article key={row._id}>
              <p className="inbox-from">
                {row.status === "simulated" ? "demo send" : row.status}
                <br />
                {row.subject}
              </p>
              <p className="inbox-body">{row.body}</p>
            </article>
          ))}
        </section>
      ) : null}
    </>
  );
}
