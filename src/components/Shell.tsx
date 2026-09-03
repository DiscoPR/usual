import { useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { HelpDialog } from "./HelpDialog";
import { MenuBar } from "./MenuBar";

export function Shell({
  children,
  status,
}: {
  children: ReactNode;
  status?: string;
}) {
  const { pathname } = useLocation();
  const [helpOpen, setHelpOpen] = useState(false);
  const [menuStatus, setMenuStatus] = useState<string | null>(null);
  const clock = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const title = titleFor(pathname);
  const ready =
    menuStatus ??
    status ??
    (pathname === "/"
      ? "Library open."
      : pathname.startsWith("/trip/")
        ? "Transfer window. Crawl, then Approve & send."
        : pathname === "/view"
          ? "Browsing public libraries."
          : pathname === "/transfer"
            ? "Transfer queue. Nothing emailed until Approve & send."
            : "Search ready. Type any town.");

  return (
    <div className="desk">
      <div className="win">
        <div className="titlebar">
          <span className="titlebar-icon" aria-hidden>
            N
          </span>
          <span className="titlebar-text">{title}</span>
          <span className="titlebar-btns" aria-hidden>
            <span className="tb-btn">_</span>
            <span className="tb-btn">□</span>
            <span className="tb-btn">×</span>
          </span>
        </div>
        <MenuBar onHelp={() => setHelpOpen(true)} onStatus={setMenuStatus} />
        <div className="toolbar">
          <NavLink to="/" end className="nav-win">
            {({ isActive }) => (
              <span className={`btn-win ${isActive ? "is-down" : ""}`}>
                Library
              </span>
            )}
          </NavLink>
          <NavLink to="/trips" className="nav-win">
            {({ isActive }) => (
              <span className={`btn-win ${isActive ? "is-down" : ""}`}>
                Search
              </span>
            )}
          </NavLink>
          <NavLink to="/view" className="nav-win">
            {({ isActive }) => (
              <span className={`btn-win ${isActive ? "is-down" : ""}`}>
                View
              </span>
            )}
          </NavLink>
          <NavLink to="/transfer" className="nav-win">
            {({ isActive }) => (
              <span className={`btn-win ${isActive ? "is-down" : ""}`}>
                Transfer
              </span>
            )}
          </NavLink>
          <button
            type="button"
            className="btn-win"
            onClick={() => setHelpOpen(true)}
          >
            Help
          </button>
          <span className="toolbar-note">
            Your usual, in this city. Inbox, library, then crawl.
          </span>
        </div>
        <div className="win-body">{children}</div>
        <div className="statusbar">
          <span className="sb-cell grow">{ready}</span>
          <span className="sb-cell">{clock}</span>
          <span className="sb-cell">Connected</span>
        </div>
      </div>
      {helpOpen ? <HelpDialog onClose={() => setHelpOpen(false)} /> : null}
    </div>
  );
}

function titleFor(pathname: string): string {
  if (pathname === "/") return "Usual - Library";
  if (pathname.startsWith("/trip/")) return "Usual - Transfer";
  if (pathname === "/view") return "Usual - View";
  if (pathname === "/transfer") return "Usual - Transfers";
  return "Usual - Search";
}

export function BootWindow({ message, status }: { message: string; status: string }) {
  return (
    <div className="desk">
      <div className="win">
        <div className="titlebar">
          <span className="titlebar-icon" aria-hidden>
            N
          </span>
          <span className="titlebar-text">Usual - Library</span>
          <span className="titlebar-btns" aria-hidden>
            <span className="tb-btn">_</span>
            <span className="tb-btn">□</span>
            <span className="tb-btn">×</span>
          </span>
        </div>
        <div className="win-body">
          <p className="empty">{message}</p>
        </div>
        <div className="statusbar">
          <span className="sb-cell grow">{status}</span>
        </div>
      </div>
    </div>
  );
}
