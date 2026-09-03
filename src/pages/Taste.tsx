import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { InboxCard } from "../components/InboxCard";
import { parseCsvPlaces } from "../lib/utils";

export function Taste({ profileId }: { profileId: Id<"profiles"> }) {
  const profile = useQuery(api.profile.getDemo);
  const places = useQuery(api.taste.list, { profileId });
  const add = useMutation(api.taste.add);
  const addMany = useMutation(api.taste.addMany);
  const remove = useMutation(api.taste.remove);
  const resetDemo = useMutation(api.seed.resetDemo);
  const enrich = useAction(api.enrich.enrichPlace);
  const [name, setName] = useState("");
  const [city, setCity] = useState("Fort Lauderdale");
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");
  const [csv, setCsv] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enriching, setEnriching] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (location.hash !== "#import") return;
    document.getElementById("import")?.scrollIntoView({ block: "start" });
  }, [location.hash]);

  async function onAdd(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await add({
        profileId,
        name,
        city,
        note,
        url: url.trim() || null,
        source: "manual",
      });
      setName("");
      setNote("");
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add place.");
    }
  }

  async function onCsv() {
    setError(null);
    const rows = parseCsvPlaces(csv);
    if (rows.length === 0) {
      setError("CSV needs name,city,note[,url] on each line.");
      return;
    }
    await addMany({ profileId, places: rows, source: "csv" });
    setCsv("");
  }

  async function onEnrich(placeId: Id<"tastePlaces">) {
    setEnriching(placeId);
    setError(null);
    const result = await enrich({ placeId });
    if (!result.enriched) setError(result.reason);
    setEnriching(null);
  }

  if (places === undefined) {
    return <p className="empty">Loading your usuals...</p>;
  }

  return (
    <>
      <InboxCard />

      <section className="pane">
        <div className="section-head">
          Your usuals
          <span className="count">{places.length} files</span>
        </div>
        <p className="pane-note pane-pad">
          Five home spots. The why line is the taste. Usual looks for the same
          kind of place in the city you land in, not a tourist list.
        </p>
        {profile && profile.categories.length > 0 ? (
          <p className="pane-note pane-pad">
            Profile: {profile.categories.join(" · ")}
            {profile.vibeTags.length > 0
              ? ` / ${profile.vibeTags.join(", ")}`
              : ""}
            {profile.priceBand ? ` · ${profile.priceBand}` : ""}
          </p>
        ) : null}
        {places.length === 0 ? (
          <p className="empty">No places yet. Add a diner, a bar, a counter.</p>
        ) : (
          <div className="lib">
            <div className="lib-head">
              <span>Filename</span>
              <span>Type</span>
              <span>Host</span>
              <span>Bitrate</span>
            </div>
            {places.map((place) => (
              <div key={place._id} className="lib-row">
                <span className="lib-name">{place.name}</span>
                <span>{place.categories.join(", ") || "file"}</span>
                <span>{place.city}</span>
                <span>{place.source === "seed" ? "seed" : place.source}</span>
                <span className="lib-why">{place.note}</span>
                {place.vibeTags.length > 0 || place.priceBand ? (
                  <span className="lib-skip">
                    {place.priceBand ? `${place.priceBand} · ` : ""}
                    {place.vibeTags.join(", ")}
                  </span>
                ) : null}
                {place.url ? (
                  <span className="lib-skip">
                    <a href={place.url} target="_blank" rel="noreferrer">
                      {place.url}
                    </a>
                    {"  "}
                    <button
                      type="button"
                      className="reset-link"
                      disabled={enriching === place._id}
                      onClick={() => void onEnrich(place._id)}
                    >
                      {enriching === place._id ? "Enriching..." : "Enrich"}
                    </button>
                  </span>
                ) : null}
                {place.source !== "seed" ? (
                  <span className="lib-skip">
                    <button
                      type="button"
                      className="reset-link"
                      onClick={() => void remove({ placeId: place._id })}
                    >
                      Remove
                    </button>
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="pane">
        <div className="section-head">Share / add a place</div>
        <form onSubmit={(event) => void onAdd(event)} className="form-stack">
          <label>
            <span>Name</span>
            <input
              className="field"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="The place you keep going back to"
            />
          </label>
          <label>
            <span>City</span>
            <input
              className="field"
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
          </label>
          <label>
            <span>Why, in one line</span>
            <input
              className="field"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Counter stool. No rush."
            />
          </label>
          <label>
            <span>URL (optional, enrich from the page)</span>
            <input
              className="field"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://"
            />
          </label>
          {error ? <p className="err">{error}</p> : null}
          <button type="submit" className="btn-win">
            Save place
          </button>
        </form>
      </section>

      <section className="pane" id="import">
        <div className="section-head">Import / CSV</div>
        <div className="form-stack">
          <p className="hint">
            Columns: name, city, note, optional url. No Google Takeout.
          </p>
          <textarea
            className="field"
            rows={4}
            value={csv}
            onChange={(event) => setCsv(event.target.value)}
            placeholder={"Lester's Diner,Fort Lauderdale,24/7 booth"}
          />
          <button type="button" className="btn-win" onClick={() => void onCsv()}>
            Import CSV
          </button>
          <button
            type="button"
            className="reset-link"
            onClick={() => void resetDemo()}
          >
            Reset demo seed
          </button>
        </div>
      </section>
    </>
  );
}
