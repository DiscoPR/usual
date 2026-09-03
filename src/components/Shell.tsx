import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";

export function Shell({
  children,
  status,
}: {
  children: ReactNode;
  status?: string;
}) {
  const { pathname } = useLocation();
  const onLibrary = pathname === "/";
  const clock = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const title = onLibrary
    ? "Usual - Library"
    : pathname.startsWith("/trip/")
      ? "Usual - Transfer"
      : "Usual - Search";
  const ready =
    status ??
    (onLibrary
      ? "Library open."
      : pathname.startsWith("/trip/")
        ? "Transfer window. Crawl, then Approve & send."
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
        <div className="menubar">
          <span className="menu-item">
            <u>F</u>ile
          </span>
          <span className="menu-item">
            <u>V</u>iew
          </span>
          <span className="menu-item">
            <u>S</u>earch
          </span>
          <span className="menu-item">
            <u>T</u>ransfer
          </span>
          <span className="menu-item">
            <u>H</u>elp
          </span>
        </div>
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
    </div>
  );
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
