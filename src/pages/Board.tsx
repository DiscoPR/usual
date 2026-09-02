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
    return <p className="text-muted">Loading trips…</p>;
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
    <section className="space-y-8">
      <InboxCard />

      <div>
        <h1 className="font-serif text-2xl">Trips</h1>
        <p className="mt-1 text-muted">
          Type any town. Usual searches public dining lists for that city,
          then scores them against your usuals. Hide below 7. Never invents a
          venue.
        </p>
      </div>

      {trips.length === 0 ? (
        <p className="border border-line bg-white/50 px-4 py-5 text-muted">
          No trips yet. Open the inbox on Taste.
        </p>
      ) : (
        <ul className="space-y-3">
          {trips.map((trip) => (
            <li key={trip._id}>
              <Link
                to={`/trip/${trip._id}`}
                className="block border border-line bg-white/70 px-4 py-4"
              >
                <p className="text-xl font-medium">{trip.city}</p>
                <p className="text-muted">{trip.dateLabel}</p>
                <p className="mt-2 text-sm">
                  {trip.matchCount} matches · {labelStatus(trip.crawlStatus)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={(event) => void onCreate(event)} className="space-y-3">
        <h2 className="font-serif text-xl">New trip</h2>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">Town</span>
          <input
            className="w-full border border-line bg-white px-3 py-2"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Hoboken, nj"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">When</span>
          <input
            className="w-full border border-line bg-white px-3 py-2"
            value={dateLabel}
            onChange={(event) => setDateLabel(event.target.value)}
            placeholder="this weekend"
          />
        </label>
        <button type="submit" className="w-full bg-ink px-4 py-3 text-paper">
          Open trip
        </button>
      </form>

      <div className="space-y-3 border-t border-line pt-6">
        <h2 className="font-serif text-xl">Email a trip</h2>
        {keys && !keys.agentmail ? (
          <p className="text-sm text-muted">
            AgentMail is not connected. This writes the same trip record a
            webhook would.
          </p>
        ) : (
          <p className="text-sm text-muted">
            Inbox is connected. You can still simulate from here.
          </p>
        )}
        <input
          className="w-full border border-line bg-white px-3 py-2"
          value={inbound}
          onChange={(event) => setInbound(event.target.value)}
          placeholder="Hoboken, nj this weekend"
        />
        <button
          type="button"
          className="w-full border border-ink px-4 py-3"
          onClick={() => void onSimulate()}
        >
          Simulate inbound email
        </button>
      </div>
    </section>
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
