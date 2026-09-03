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
      <div className="desk">
        <div className="win">
          <div className="titlebar">
            <span className="titlebar-text">Usual - Library</span>
          </div>
          <div className="win-body">
            <p className="empty">
              Convex URL is missing. Run <code>npx convex dev</code> and restart
              the Vite server.
            </p>
          </div>
        </div>
      </div>
    )}
  </StrictMode>,
);
