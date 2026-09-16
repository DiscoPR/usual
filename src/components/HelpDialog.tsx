export function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="dlg-back" onClick={onClose}>
      <div
        className="dlg win"
        role="dialog"
        aria-labelledby="help-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="titlebar">
          <span className="titlebar-icon" aria-hidden>
            ?
          </span>
          <span className="titlebar-text" id="help-title">
            Usual Help
          </span>
          <span className="titlebar-btns">
            <button type="button" className="tb-btn" onClick={onClose}>
              ×
            </button>
          </span>
        </div>
        <div className="dlg-body">
          <p className="pane-note">
            Usual finds your kind of place in the city you land in. It is not a
            tourist map.
          </p>
          <ol className="help-steps">
            <li>
              <strong>Library first.</strong> Keep 5 to 12 usuals. The Fort
              Lauderdale seed is Lester's, Padrino's, Elbo Room, BREW, and
              Island Water Sports.
            </li>
            <li>
              <strong>Get to know the trip.</strong> Pick who is going, any
              theme, what the group likes, and the weather. That tilts the
              crawl. It does not replace your usuals.
            </li>
            <li>
              <strong>Search any town.</strong> Firecrawl looks up public lists
              and scrapes those pages only. No invented venues.
            </li>
            <li>
              <strong>Read the tiers.</strong> Top 5 is almost your usual. Middle
              5 has real overlap. Maybe has one or two overlapping things and
              still a reason. If the crawl is thin, Usual says so.
            </li>
            <li>
              <strong>Approve & send.</strong> After grounded places land, the
              list drafts itself. The button stays on. AgentMail sends when
              keys and a Send to address are set. Otherwise the outbound stays
              in-app so the loop still finishes.
            </li>
          </ol>
          <p className="hint">
            Inbox already holds Austin this weekend. Open it for the short demo.
            No grounded surf shop still shows as a miss.
          </p>
          <button type="button" className="btn-go" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
