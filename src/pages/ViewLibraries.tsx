import { useQuery } from "convex/react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { PUBLIC_LIBRARIES } from "../lib/publicLibraries";

export function ViewLibraries({ profileId }: { profileId: Id<"profiles"> }) {
  const places = useQuery(api.taste.list, { profileId });
  const trips = useQuery(api.trips.list, { profileId });
  const navigate = useNavigate();
  const [openNick, setOpenNick] = useState<string | null>(null);

  if (places === undefined || trips === undefined) {
    return <p className="empty">Opening public libraries...</p>;
  }

  return (
    <>
      <section className="pane">
        <div className="section-head">
          My library
          <span className="count">{places.length} files</span>
        </div>
        <p className="pane-note pane-pad">
          Your usuals, the taste anchors. Public libraries below are other
          people's shared list pages, not invented venues.
        </p>
        <div className="row-actions">
          <Link to="/" className="btn-win">
            Open my library
          </Link>
        </div>
      </section>

      <section className="pane">
        <div className="section-head">
          Saved city lists
          <span className="count">{trips.length}</span>
        </div>
        {trips.length === 0 ? (
          <p className="empty">No saved cities yet. Search a town first.</p>
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
                <span>{trip.crawlStatus}</span>
                <span>{trip.dateLabel}</span>
                <span>{trip.matchCount}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="pane">
        <div className="section-head">
          Public libraries
          <span className="count">{PUBLIC_LIBRARIES.length} users</span>
        </div>
        <p className="pane-note pane-pad">
          Browse what other people have shared. These are public list pages.
          Search the town to crawl them into Top / Middle / Maybe.
        </p>
        <div className="lib">
          <div className="lib-head">
            <span>Filename</span>
            <span>Type</span>
            <span>Host</span>
            <span>Bitrate</span>
          </div>
          {PUBLIC_LIBRARIES.map((lib) => (
            <button
              key={lib.nick}
              type="button"
              className={`lib-row ${openNick === lib.nick ? "active" : ""}`}
              onClick={() =>
                setOpenNick(openNick === lib.nick ? null : lib.nick)
              }
            >
              <span className="lib-name">{lib.nick}</span>
              <span>{lib.title}</span>
              <span>{lib.city}</span>
              <span>{lib.lists.length || places.length}</span>
            </button>
          ))}
        </div>
        {PUBLIC_LIBRARIES.filter((lib) => lib.nick === openNick).map((lib) => (
          <div key={lib.nick} className="form-stack">
            <p className="hint">{lib.note}</p>
            {lib.lists.map((list) => (
              <p key={list.url} className="hint">
                <a href={list.url} target="_blank" rel="noreferrer">
                  {list.label}
                </a>
              </p>
            ))}
            <div className="xfer-row">
              {lib.searchCity ? (
                <button
                  type="button"
                  className="btn-go"
                  onClick={() =>
                    navigate(`/trips?city=${encodeURIComponent(lib.searchCity)}`)
                  }
                >
                  Search {lib.city}
                </button>
              ) : (
                <Link to="/" className="btn-go">
                  Open usuals
                </Link>
              )}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
