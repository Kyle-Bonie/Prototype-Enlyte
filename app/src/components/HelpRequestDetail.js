import { useState } from "react";
import "./HelpRequestDetail.css";

function HelpRequestDetail({ request, agents, onClose }) {
  const [replyText, setReplyText] = useState("");
  const [replySent, setReplySent] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [reassigned, setReassigned] = useState(false);

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    setReplySent(true);
    setReplyText("");
    setTimeout(() => setReplySent(false), 3000);
  };

  const handleReassign = () => {
    if (!selectedAgent) return;
    setReassigned(true);
    setTimeout(() => {
      setReassigned(false);
      setSelectedAgent("");
    }, 3000);
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
            {replySent && (
              <span className="hrd-success-msg">✓ Reply sent successfully</span>
            )}
            <button
              className="hrd-btn hrd-btn--primary"
              onClick={handleSendReply}
              disabled={!replyText.trim()}
            >
              Send Reply
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
            {reassigned && (
              <span className="hrd-success-msg">✓ Case reassigned to {selectedAgent}</span>
            )}
            <button
              className="hrd-btn hrd-btn--accent"
              onClick={handleReassign}
              disabled={!selectedAgent}
            >
              Confirm Reassign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HelpRequestDetail;
