import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { getConvexUrl } from "@convex-dev/static-hosting";
import App from "./App";
import "./index.css";

function convexUrl(): string {
  if (import.meta.env.VITE_CONVEX_URL) return import.meta.env.VITE_CONVEX_URL;
  try {
    return getConvexUrl();
  } catch {
    return "";
  }
}

const url = convexUrl();
const client = url ? new ConvexReactClient(url) : null;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {client ? (
      <ConvexProvider client={client}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConvexProvider>
    ) : (
      <main className="mx-auto max-w-md px-5 py-16">
        <p className="font-serif text-3xl">Usual</p>
        <p className="mt-3 text-muted">
          Convex URL is missing. Run <code>npx convex dev</code> and restart
          the Vite server.
        </p>
      </main>
    )}
  </StrictMode>,
);
