import { Navigate, Route, Routes } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "../convex/_generated/api";
import { BootWindow, Shell } from "./components/Shell";
import { Board } from "./pages/Board";
import { Taste } from "./pages/Taste";
import { Transfer } from "./pages/Transfer";
import { Trip } from "./pages/Trip";
import { ViewLibraries } from "./pages/ViewLibraries";

export default function App() {
  const profile = useQuery(api.profile.getDemo);
  const ensureDemo = useMutation(api.seed.ensureDemo);

  useEffect(() => {
    void ensureDemo();
  }, [ensureDemo]);

  if (profile === undefined) {
    return (
      <BootWindow message="Opening the library..." status="Connecting..." />
    );
  }

  if (profile === null) {
    return (
      <BootWindow
        message="Seeding the library..."
        status="Writing Fort Lauderdale files..."
      />
    );
  }

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Taste profileId={profile._id} />} />
        <Route path="/trips" element={<Board profileId={profile._id} />} />
        <Route path="/view" element={<ViewLibraries profileId={profile._id} />} />
        <Route path="/transfer" element={<Transfer profileId={profile._id} />} />
        <Route path="/trip/:tripId" element={<Trip />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
