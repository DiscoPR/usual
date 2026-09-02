import { useAction, useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { parseCsvPlaces } from "../lib/utils";

export function Taste({ profileId }: { profileId: Id<"profiles"> }) {
  const profile = useQuery(api.profile.getDemo);
  const places = useQuery(api.taste.list, { profileId });
  const add = useMutation(api.taste.add);
  const addMany = useMutation(api.taste.addMany);
  const remove = useMutation(api.taste.remove);
  const enrich = useAction(api.enrich.enrichPlace);
  const [name, setName] = useState("");
  const [city, setCity] = useState("Fort Lauderdale");
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");
  const [csv, setCsv] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enriching, setEnriching] = useState<string | null>(null);

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
    return <p className="text-muted">Loading your usuals…</p>;
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl">Your usuals</h1>
        <p className="mt-1 text-muted">
          Five to twelve home spots. The why line sets the tags. A URL can
          enrich the card. No Google Takeout.
        </p>
        {profile && profile.categories.length > 0 ? (
          <p className="mt-3 text-sm text-muted">
            Profile: {profile.categories.join(" · ")}
            {profile.vibeTags.length > 0
              ? ` — ${profile.vibeTags.join(", ")}`
              : ""}
            {profile.priceBand ? ` · ${profile.priceBand}` : ""}
          </p>
        ) : null}
      </div>

      {places.length === 0 ? (
        <p className="border border-line bg-white/50 px-4 py-5 text-muted">
          No places yet. Add a diner, a bar, a counter.
        </p>
      ) : (
        <ul className="space-y-3">
          {places.map((place) => (
            <li
              key={place._id}
              className="border border-line bg-white/70 px-4 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-medium">{place.name}</p>
                  <p className="text-sm text-muted">{place.city}</p>
                  <p className="mt-2 text-base">{place.note}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-muted">
                    {place.categories.join(" · ")}
                    {place.priceBand ? ` · ${place.priceBand}` : ""}
                    {place.vibeTags.length > 0
                      ? ` — ${place.vibeTags.join(", ")}`
                      : ""}
                  </p>
                  {place.url ? (
                    <a
                      href={place.url}
                      className="mt-2 inline-block text-sm text-accent underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Source URL
                    </a>
                  ) : null}
                  {place.source === "seed" ? (
                    <p className="mt-2 text-xs uppercase tracking-wide text-muted">
                      Demo seed
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {place.url ? (
                    <button
                      type="button"
                      className="text-sm text-accent underline"
                      disabled={enriching === place._id}
                      onClick={() => void onEnrich(place._id)}
                    >
                      {enriching === place._id ? "Enriching…" : "Enrich"}
                    </button>
                  ) : null}
                  {place.source !== "seed" ? (
                    <button
                      type="button"
                      className="text-sm text-accent underline"
                      onClick={() => void remove({ placeId: place._id })}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={(event) => void onAdd(event)} className="space-y-3">
        <h2 className="font-serif text-xl">Add one</h2>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">Name</span>
          <input
            className="w-full border border-line bg-white px-3 py-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="The place you keep going back to"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">City</span>
          <input
            className="w-full border border-line bg-white px-3 py-2"
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">Why, in one line</span>
          <input
            className="w-full border border-line bg-white px-3 py-2"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Counter stool. No rush."
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">
            URL (optional — enrich from the page)
          </span>
          <input
            className="w-full border border-line bg-white px-3 py-2"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://"
          />
        </label>
        {error ? <p className="text-accent">{error}</p> : null}
        <button type="submit" className="w-full bg-ink px-4 py-3 text-paper">
          Save place
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="font-serif text-xl">CSV import</h2>
        <p className="text-sm text-muted">
          Columns: name, city, note, optional url. No Google Takeout.
        </p>
        <textarea
          className="w-full border border-line bg-white px-3 py-2"
          rows={4}
          value={csv}
          onChange={(event) => setCsv(event.target.value)}
          placeholder={"Lester's Diner,Fort Lauderdale,Late eggs"}
        />
        <button
          type="button"
          className="w-full border border-ink px-4 py-3"
          onClick={() => void onCsv()}
        >
          Import CSV
        </button>
      </div>
    </section>
  );
}
