import { useState } from "react";
import "./HelpRequestDetail.css";

// request: help request object from Firestore (via helpRequestsAPI.mapDoc)
// agents:  array of user objects { id, name } for the reassign dropdown
// onReply(id, replyText): async fn — saves reply to Firestore
// onReassign(id, agentName): async fn — saves reassignment to Firestore
// onClose: fn — closes the panel
function HelpRequestDetail({ request, agents, onReply, onReassign, onClose }) {
  const [replyText, setReplyText] = useState("");
  const [replySent, setReplySent] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState("");

  const [selectedAgent, setSelectedAgent] = useState("");
  const [reassigned, setReassigned] = useState(false);
  const [reassignLoading, setReassignLoading] = useState(false);
  const [reassignError, setReassignError] = useState("");

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setReplyLoading(true);
    setReplyError("");
    try {
      await onReply(request.id, replyText.trim());
      setReplySent(true);
      setReplyText("");
      setTimeout(() => setReplySent(false), 3000);
    } catch (err) {
      setReplyError("Failed to send reply. Please try again.");
    } finally {
      setReplyLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!selectedAgent) return;
    setReassignLoading(true);
    setReassignError("");
    try {
      await onReassign(request.id, selectedAgent);
      setReassigned(true);
      setTimeout(() => {
        setReassigned(false);
        setSelectedAgent("");
      }, 3000);
    } catch (err) {
      setReassignError("Failed to reassign. Please try again.");
    } finally {
      setReassignLoading(false);
    }
  };

  return (
    <div className="hrd-panel">
      {/* Panel Header */}
      <div className="hrd-header">
        <div className="hrd-header-left">
          <div className="hrd-avatar">{request.agent.charAt(0)}</div>
          <div className="hrd-header-info">
            <span className="hrd-agent-name">{request.agent}</span>
            <span className="hrd-case-badge">{request.caseNumber}</span>
          </div>
        </div>
        <div className="hrd-header-right">
          <span className="hrd-time-tag">🕐 {request.time}</span>
          <button className="hrd-close-btn" onClick={onClose} aria-label="Close panel">
            ×
          </button>
        </div>
      </div>

      {/* Request Reason */}
      <div className="hrd-reason-block">
        <p className="hrd-reason-label">Help Request</p>
        <p className="hrd-reason-text">{request.reason}</p>
      </div>

      {/* Action history: shows previous reply & reassignment if they exist */}
      {(request.reply || request.reassignedTo) && (
        <div className="hrd-history-block">
          <p className="hrd-reason-label">History</p>
          {request.reply && (
            <div className="hrd-history-entry">
              <span className="hrd-history-icon">💬</span>
              <div className="hrd-history-body">
                <span className="hrd-history-meta">
                  Replied by <strong>{request.repliedBy || "Team Lead"}</strong>
                  {request.repliedAt ? ` · ${request.repliedAt}` : ""}
                </span>
                <p className="hrd-history-text">{request.reply}</p>
              </div>
            </div>
          )}
          {request.reassignedTo && (
            <div className="hrd-history-entry">
              <span className="hrd-history-icon">🔁</span>
              <div className="hrd-history-body">
                <span className="hrd-history-meta">
                  Case reassigned to <strong>{request.reassignedTo}</strong>
                  {request.reassignedAt ? ` · ${request.reassignedAt}` : ""}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Sections */}
      <div className="hrd-actions-grid">
        {/* Reply Section */}
        <div className="hrd-action-card">
          <div className="hrd-action-header">
            <span className="hrd-action-icon">💬</span>
            <span className="hrd-action-title">Reply to Agent</span>
          </div>
          <textarea
            className="hrd-textarea"
            placeholder={`Write a reply to ${request.agent}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={3}
          />
          <div className="hrd-action-footer">
            {replyError && <span className="hrd-error-msg">{replyError}</span>}
            {replySent && (
              <span className="hrd-success-msg">✓ Reply sent successfully</span>
            )}
            <button
              className="hrd-btn hrd-btn--primary"
              onClick={handleSendReply}
              disabled={!replyText.trim() || replyLoading}
            >
              {replyLoading ? "Sending..." : "Send Reply"}
            </button>
          </div>
        </div>

        {/* Reassign Section */}
        <div className="hrd-action-card">
          <div className="hrd-action-header">
            <span className="hrd-action-icon">🔁</span>
            <span className="hrd-action-title">Reassign Case</span>
          </div>
          <p className="hrd-reassign-meta">
            Case <strong>{request.caseNumber}</strong> will be reassigned to the selected agent.
          </p>
          <select
            className="hrd-select"
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
          >
            <option value="" disabled>Select an agent</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.name}>
                {agent.name}
              </option>
            ))}
          </select>
          <div className="hrd-action-footer">
            {reassignError && <span className="hrd-error-msg">{reassignError}</span>}
            {reassigned && (
              <span className="hrd-success-msg">✓ Case reassigned to {selectedAgent}</span>
            )}
            <button
              className="hrd-btn hrd-btn--accent"
              onClick={handleReassign}
              disabled={!selectedAgent || reassignLoading}
            >
              {reassignLoading ? "Reassigning..." : "Confirm Reassign"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HelpRequestDetail;
