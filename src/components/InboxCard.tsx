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
    <section className="pane">
      <div className="section-head">
        Inbox
        <span className="count">{inbox.length} new</span>
      </div>
      {inbox.map((message) => (
        <article key={message._id}>
          <p className="inbox-from">
            From: {message.fromLabel}
            <br />
            Subject: {message.subject}
          </p>
          <p className="inbox-body">{message.body}</p>
          <div className="inbox-actions">
            <button
              type="button"
              className="btn-go"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void accept({ messageId: message._id })
                  .then((tripId) => navigate(`/trip/${tripId}`))
                  .finally(() => setBusy(false));
              }}
            >
              {busy ? "Opening..." : "Open this trip"}
            </button>
            <span className="hint">AgentMail. Opens the trip from the subject.</span>
          </div>
        </article>
      ))}
    </section>
  );
}
