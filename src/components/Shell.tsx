import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-24 pt-6">
      <header className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <p className="font-serif text-4xl leading-none tracking-tight">Usual</p>
          <span className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted">
            Demo
          </span>
        </div>
        <p className="mt-2 text-base text-muted">Your usual, in this city.</p>
      </header>
      <div className="flex-1">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-paper">
        <div className="mx-auto grid max-w-lg grid-cols-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center justify-center px-4 py-3 text-base font-medium ${
                isActive ? "text-accent" : "text-ink"
              }`
            }
            end
          >
            Taste
          </NavLink>
          <NavLink
            to="/trips"
            className={({ isActive }) =>
              `flex items-center justify-center px-4 py-3 text-base font-medium ${
                isActive ? "text-accent" : "text-ink"
              }`
            }
          >
            Trips
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
