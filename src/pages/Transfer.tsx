import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { copyText, usualsShareText } from "../lib/shareText";

export function Transfer({ profileId }: { profileId: Id<"profiles"> }) {
  const places = useQuery(api.taste.list, { profileId });
  const trips = useQuery(api.trips.list, { profileId });
  const shares = useQuery(api.shares.list, { profileId });
  const queue = useMutation(api.shares.queue);
  const [params] = useSearchParams();
  const fromTrip = params.get("from");
  const [toLabel, setToLabel] = useState("a friend");
  const [kind, setKind] = useState<"usuals" | "trip">(
    fromTrip ? "trip" : "usuals",
  );
  const [tripId, setTripId] = useState(fromTrip ?? "");
  const [notice, setNotice] = useState<string | null>(null);
  const selectedTrip = useQuery(
    api.trips.get,
    kind === "trip" && tripId
      ? { tripId: tripId as Id<"trips"> }
      : "skip",
  );

  const payload = useMemo(() => {
    if (kind === "usuals") {
      const body = usualsShareText(places ?? []);
      return { subject: "Your usuals", body };
    }
    if (selectedTrip?.emailDraft) {
      return {
        subject: selectedTrip.emailSubject ?? `Your usual, in ${selectedTrip.city}`,
        body: selectedTrip.emailDraft,
      };
    }
    if (selectedTrip) {
      return {
        subject: `Your usual, in ${selectedTrip.city}`,
        body: `${selectedTrip.city} (${selectedTrip.dateLabel}). Draft the trip list first, then transfer.`,
      };
    }
    return { subject: "Usual list", body: "" };
  }, [kind, places, selectedTrip]);

  if (places === undefined || trips === undefined || shares === undefined) {
    return <p className="empty">Opening transfers...</p>;
  }

  async function onCopy() {
    const ok = await copyText(payload.body);
    setNotice(ok ? "List copied. Paste it to a friend." : "Copy failed.");
  }

  async function onQueue() {
    setNotice(null);
    try {
      await queue({
        profileId,
        kind,
        toLabel,
        subject: payload.subject,
        body: payload.body,
        tripId: kind === "trip" && tripId ? (tripId as Id<"trips">) : null,
      });
      setNotice(`Queued to ${toLabel}. Nothing emailed.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Transfer failed.");
    }
  }

  return (
    <>
      <section className="pane">
        <div className="section-head">Transfer</div>
        <p className="pane-note pane-pad">
          Send a list the Napster way. Copy it or queue it to a friend nick.
          Email still waits for Approve & send on the trip board.
        </p>
        <div className="form-stack">
          <label>
            <span>To (friend nick)</span>
            <input
              className="field"
              value={toLabel}
              onChange={(event) => setToLabel(event.target.value)}
              placeholder="HotSauceFan99"
            />
          </label>
          <fieldset className="choice-set">
            <legend>What to send</legend>
            <div className="choice-row">
              <button
                type="button"
                className={`btn-win ${kind === "usuals" ? "is-down" : ""}`}
                onClick={() => setKind("usuals")}
              >
                Usuals
              </button>
              <button
                type="button"
                className={`btn-win ${kind === "trip" ? "is-down" : ""}`}
                onClick={() => setKind("trip")}
              >
                Trip list
              </button>
            </div>
          </fieldset>
          {kind === "trip" ? (
            <label>
              <span>Saved city</span>
              <select
                className="field"
                value={tripId}
                onChange={(event) => setTripId(event.target.value)}
              >
                <option value="">Pick a trip</option>
                {trips.map((trip) => (
                  <option key={trip._id} value={trip._id}>
                    {trip.city} ({trip.dateLabel})
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <textarea className="field" rows={8} readOnly value={payload.body} />
          <div className="xfer-row">
            <button type="button" className="btn-win" onClick={() => void onCopy()}>
              Copy list
            </button>
            <button type="button" className="btn-go" onClick={() => void onQueue()}>
              Queue transfer
            </button>
          </div>
          {notice ? <p className="ok">{notice}</p> : null}
        </div>
      </section>

      <section className="pane">
        <div className="section-head">
          Transfer queue
          <span className="count">{shares.length}</span>
        </div>
        {shares.length === 0 ? (
          <p className="empty">
            No transfers yet. Queue a usuals list or a drafted trip.
          </p>
        ) : (
          <div className="lib">
            <div className="lib-head">
              <span>Filename</span>
              <span>Type</span>
              <span>Host</span>
              <span>Bitrate</span>
            </div>
            {shares.map((share) => (
              <div key={share._id} className="lib-row">
                <span className="lib-name">{share.subject}</span>
                <span>{share.kind}</span>
                <span>{share.toLabel}</span>
                <span>queued</span>
                <span className="lib-why">{share.body}</span>
                {share.tripId ? (
                  <span className="lib-skip">
                    <Link to={`/trip/${share.tripId}`}>Open trip</Link>
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
