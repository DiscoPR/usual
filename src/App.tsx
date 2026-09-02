import { Navigate, Route, Routes } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "../convex/_generated/api";
import { Shell } from "./components/Shell";
import { Board } from "./pages/Board";
import { Taste } from "./pages/Taste";
import { Trip } from "./pages/Trip";

export default function App() {
  const profile = useQuery(api.profile.getDemo);
  const ensureDemo = useMutation(api.seed.ensureDemo);

  useEffect(() => {
    if (profile === null) {
      void ensureDemo();
    }
  }, [profile, ensureDemo]);

  if (profile === undefined) {
    return (
      <main className="mx-auto max-w-md px-5 py-16">
        <p className="font-serif text-3xl">Usual</p>
        <p className="mt-3 text-muted">Loading the board…</p>
      </main>
    );
  }

  if (profile === null) {
    return (
      <main className="mx-auto max-w-md px-5 py-16">
        <p className="font-serif text-3xl">Usual</p>
        <p className="mt-3 text-muted">Seeding the Fort Lauderdale demo…</p>
      </main>
    );
  }

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Taste profileId={profile._id} />} />
        <Route path="/trips" element={<Board profileId={profile._id} />} />
        <Route path="/trip/:tripId" element={<Trip />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
