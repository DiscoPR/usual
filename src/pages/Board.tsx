import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { InboxCard } from "../components/InboxCard";

export function Board({ profileId }: { profileId: Id<"profiles"> }) {
  const trips = useQuery(api.trips.list, { profileId });
  const keys = useQuery(api.profile.integrationStatus);
  const create = useMutation(api.trips.create);
  const simulate = useMutation(api.mail.simulateInbound);
  const navigate = useNavigate();
  const [city, setCity] = useState("Hoboken, nj");
  const [dateLabel, setDateLabel] = useState("this weekend");
  const [inbound, setInbound] = useState("Hoboken, nj this weekend");

  if (trips === undefined) {
    return <p className="empty">Loading search...</p>;
  }

  async function onCreate(event: React.FormEvent) {
    event.preventDefault();
    const tripId = await create({ profileId, city, dateLabel });
    navigate(`/trip/${tripId}`);
  }

  async function onSimulate() {
    const tripId = await simulate({ text: inbound });
    if (tripId) navigate(`/trip/${tripId}`);
  }

  return (
    <>
      <InboxCard />

      <section className="pane">
        <div className="section-head">
          Search
          <span className="count">any town</span>
        </div>
        <p className="pane-note pane-pad">
          Type any town. Usual searches public dining lists for that city, then
          scores them against your usuals. Hide below 7. Never invents a venue.
        </p>
        <form onSubmit={(event) => void onCreate(event)} className="form-stack">
          <label>
            <span>Town</span>
            <input
              className="field"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Hoboken, nj"
            />
          </label>
          <label>
            <span>When</span>
            <input
              className="field"
              value={dateLabel}
              onChange={(event) => setDateLabel(event.target.value)}
              placeholder="this weekend"
            />
          </label>
          <button type="submit" className="btn-go">
            Search
          </button>
        </form>
      </section>

      <section className="pane">
        <div className="section-head">
          Results
          <span className="count">{trips.length}</span>
        </div>
        {trips.length === 0 ? (
          <p className="empty">No results yet. Open the inbox on Library.</p>
        ) : (
          <div className="lib">
            <div className="lib-head">
              <span>Filename</span>
              <span>Type</span>
              <span>Host</span>
              <span>Bitrate</span>
            </div>
            {trips.map((trip) => (
              <Link
                key={trip._id}
                to={`/trip/${trip._id}`}
                className="lib-row"
              >
                <span className="lib-name">{trip.city}</span>
                <span>{labelStatus(trip.crawlStatus)}</span>
                <span>{trip.dateLabel}</span>
                <span>{trip.matchCount}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="pane">
        <div className="section-head">Email a trip</div>
        <div className="form-stack">
          {keys && !keys.agentmail ? (
            <p className="hint">
              AgentMail is not connected. This writes the same trip record a
              webhook would.
            </p>
          ) : (
            <p className="hint">
              Inbox is connected. You can still simulate from here.
            </p>
          )}
          <input
            className="field"
            value={inbound}
            onChange={(event) => setInbound(event.target.value)}
            placeholder="Hoboken, nj this weekend"
          />
          <button
            type="button"
            className="btn-win"
            onClick={() => void onSimulate()}
          >
            Simulate inbound email
          </button>
        </div>
      </section>
    </>
  );
}

function labelStatus(status: string): string {
  if (status === "demo") return "demo crawl";
  if (status === "missing_key") return "no Firecrawl key";
  if (status === "crawling") return "crawling";
  if (status === "ready") return "crawled";
  if (status === "failed") return "crawl failed";
  return status;
}
