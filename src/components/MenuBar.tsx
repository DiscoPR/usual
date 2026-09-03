import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { copyText, downloadText, usualsCsv, usualsShareText } from "../lib/shareText";

const MENUS = ["file", "view", "search", "transfer", "help"] as const;
type MenuId = (typeof MENUS)[number];

export function MenuBar({
  onHelp,
  onStatus,
}: {
  onHelp: () => void;
  onStatus: (text: string) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useQuery(api.profile.getDemo);
  const places = useQuery(
    api.taste.list,
    profile ? { profileId: profile._id } : "skip",
  );
  const resetDemo = useMutation(api.seed.resetDemo);
  const [open, setOpen] = useState<MenuId | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!barRef.current?.contains(event.target as Node)) setOpen(null);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function go(path: string) {
    setOpen(null);
    navigate(path);
  }

  function exportUsuals() {
    if (!places || places.length === 0) {
      onStatus("Library empty. Nothing to export.");
      return;
    }
    downloadText("usuals.csv", usualsCsv(places), "text/csv");
    onStatus("Saved usuals.csv to your downloads.");
    setOpen(null);
  }

  async function copyUsuals() {
    if (!places || places.length === 0) {
      onStatus("Library empty. Nothing to copy.");
      return;
    }
    const ok = await copyText(usualsShareText(places));
    onStatus(ok ? "Usuals copied. Paste them to a friend." : "Copy failed.");
    setOpen(null);
  }

  return (
    <div className="menubar" ref={barRef}>
      <MenuDrop
        id="file"
        label="File"
        hot="F"
        open={open}
        setOpen={setOpen}
        items={[
          { label: "New trip...", onClick: () => go("/trips") },
          { label: "Import CSV...", onClick: () => go("/#import") },
          { label: "Export usuals...", onClick: exportUsuals },
          { label: "Reset demo seed", onClick: () => void resetDemo({}).then(() => {
            onStatus("Demo seed rewritten.");
            go("/");
          }) },
        ]}
      />
      <MenuDrop
        id="view"
        label="View"
        hot="V"
        open={open}
        setOpen={setOpen}
        items={[
          { label: "My library", onClick: () => go("/") },
          { label: "Saved city lists", onClick: () => go("/trips") },
          { label: "Public libraries...", onClick: () => go("/view") },
        ]}
      />
      <MenuDrop
        id="search"
        label="Search"
        hot="S"
        open={open}
        setOpen={setOpen}
        items={[
          { label: "Search any town...", onClick: () => go("/trips") },
          {
            label: "Search Austin, tx",
            onClick: () => go("/trips?city=Austin%2C%20tx"),
          },
          {
            label: "Search Hoboken, nj",
            onClick: () => go("/trips?city=Hoboken%2C%20nj"),
          },
          {
            label: "Search Lisbon",
            onClick: () => go("/trips?city=Lisbon"),
          },
        ]}
      />
      <MenuDrop
        id="transfer"
        label="Transfer"
        hot="T"
        open={open}
        setOpen={setOpen}
        items={[
          { label: "Open transfers...", onClick: () => go("/transfer") },
          { label: "Copy usuals to clipboard", onClick: () => void copyUsuals() },
          {
            label: location.pathname.startsWith("/trip/")
              ? "Share this trip..."
              : "Share a trip...",
            onClick: () =>
              go(
                location.pathname.startsWith("/trip/")
                  ? `/transfer?from=${location.pathname.split("/")[2] ?? ""}`
                  : "/transfer",
              ),
          },
        ]}
      />
      <MenuDrop
        id="help"
        label="Help"
        hot="H"
        open={open}
        setOpen={setOpen}
        items={[
          {
            label: "How to use Usual...",
            onClick: () => {
              setOpen(null);
              onHelp();
            },
          },
        ]}
      />
    </div>
  );
}

function MenuDrop({
  id,
  label,
  hot,
  open,
  setOpen,
  items,
}: {
  id: MenuId;
  label: string;
  hot: string;
  open: MenuId | null;
  setOpen: (id: MenuId | null) => void;
  items: Array<{ label: string; onClick: () => void }>;
}) {
  const active = open === id;
  return (
    <div className="menu-wrap">
      <button
        type="button"
        className={`menu-item ${active ? "is-open" : ""}`}
        onClick={() => setOpen(active ? null : id)}
      >
        <u>{hot}</u>
        {label.slice(1)}
      </button>
      {active ? (
        <div className="menu-drop">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              className="menu-cmd"
              onClick={item.onClick}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
