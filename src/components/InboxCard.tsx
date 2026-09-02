import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";

export function InboxCard() {
  const inbox = useQuery(api.mail.listInbox);
  const accept = useMutation(api.mail.acceptInbound);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  if (inbox === undefined || inbox.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl">Inbox</h2>
        <span className="text-xs uppercase tracking-wide text-muted">
          AgentMail
        </span>
      </div>
      {inbox.map((message) => (
        <article
          key={message._id}
          className="border border-line bg-white/80 px-4 py-4"
        >
          <p className="text-xs uppercase tracking-wide text-muted">
            From {message.fromLabel}
          </p>
          <p className="mt-1 text-lg font-medium">{message.subject}</p>
          <p className="mt-2 whitespace-pre-wrap text-base">{message.body}</p>
          <button
            type="button"
            className="mt-4 w-full bg-ink px-4 py-3 text-paper disabled:opacity-50"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void accept({ messageId: message._id })
                .then((tripId) => navigate(`/trip/${tripId}`))
                .finally(() => setBusy(false));
            }}
          >
            {busy ? "Opening…" : "Open this trip"}
          </button>
        </article>
      ))}
    </div>
  );
}
