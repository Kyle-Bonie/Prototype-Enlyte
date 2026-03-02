import "./MyRequests.css";

// Status config: label + colour token
const STATUS_CONFIG = {
  pending:    { label: "Pending",    cls: "mr-badge--pending" },
  replied:    { label: "Replied",    cls: "mr-badge--replied" },
  reassigned: { label: "Reassigned", cls: "mr-badge--reassigned" },
};

function MyRequests({ requests = [] }) {
  if (requests.length === 0) {
    return (
      <div className="mr-empty">
        <span className="mr-empty-icon">💬</span>
        <p className="mr-empty-title">No help requests yet</p>
        <p className="mr-empty-sub">
          Use the <strong>Need Help?</strong> button on a case to send a request to your team lead.
        </p>
      </div>
    );
  }

  return (
    <div className="mr-list">
      {requests.map((req) => {
        const statusCfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending;
        // Consider replied if reply text exists OR status says so
        const hasReply    = !!(req.reply && req.reply.trim()) || req.status === "replied";
        const hasReassign = !!(req.reassignedTo && req.reassignedTo.trim()) || req.status === "reassigned";

        return (
          <article className="mr-ticket" key={req.id}>
            {/* ── Ticket header ─────────────────────────────── */}
            <div className="mr-ticket-header">
              <div className="mr-ticket-meta">
                <span className="mr-case-chip">{req.caseNumber || "—"}</span>
                <span className={`mr-badge ${statusCfg.cls}`}>{statusCfg.label}</span>
              </div>
              <span className="mr-ticket-time">{req.time}</span>
            </div>

            {/* ── Request reason ────────────────────────────── */}
            <div className="mr-ticket-body">
              <p className="mr-section-label">Your Request</p>
              <p className="mr-reason-text">{req.reason}</p>
            </div>

            {/* ── Team lead reply ───────────────────────────── */}
            {hasReply && (
              <div className="mr-reply-block">
                <div className="mr-reply-header">
                  <span className="mr-reply-icon">💬</span>
                  <span className="mr-reply-by">{req.repliedBy || "Team Lead"}</span>
                  <span className="mr-reply-time">{req.repliedAt}</span>
                </div>
                <p className="mr-reply-text">
                  {(req.reply && req.reply.trim()) || "Reply received."}
                </p>
              </div>
            )}

            {/* ── Reassign notice ───────────────────────────── */}
            {hasReassign && (
              <div className="mr-reassign-block">
                <span className="mr-reassign-icon">🔄</span>
                <span className="mr-reassign-text">
                  Case reassigned to <strong>{req.reassignedTo}</strong>
                </span>
                {req.reassignedAt && (
                  <span className="mr-reply-time">{req.reassignedAt}</span>
                )}
              </div>
            )}

            {/* ── Awaiting reply placeholder ────────────────── */}
            {!hasReply && !hasReassign && (
              <div className="mr-awaiting">
                <span className="mr-awaiting-dot" />
                Awaiting team lead response…
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

export default MyRequests;
