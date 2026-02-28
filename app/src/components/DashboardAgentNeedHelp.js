import { useState } from "react";

function DashboardAgentNeedHelp({ isOpen, onClose, caseData, onSubmit }) {
  const [selectedHelpCase, setSelectedHelpCase] = useState("");
  const [helpReason, setHelpReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!selectedHelpCase || !helpReason.trim()) {
      setError("Please select a case and provide a reason.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onSubmit({ caseId: selectedHelpCase, reason: helpReason.trim() });
      alert(`Help request submitted for case ${selectedHelpCase}`);
      handleClose();
    } catch (err) {
      setError("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedHelpCase("");
    setHelpReason("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="tl-modal" role="dialog" aria-modal="true">
      <div className="tl-modal-backdrop" onClick={handleClose} />
      <div className="tl-modal-card">
        <button
          className="tl-modal-close"
          type="button"
          onClick={handleClose}
          aria-label="Close"
        >
          ×
        </button>
        <div className="tl-assign-box">
          <h3 className="tl-assign-title">Need Help?</h3>
          <p className="tl-assign-text">
            Select a case and provide a reason for assistance.
          </p>
          {error ? (
            <p style={{ color: "#dc2626", fontSize: "13px", margin: "0 0 8px" }}>{error}</p>
          ) : null}
          <label className="tl-assign-field">
            <span className="tl-assign-label">Select case:</span>
            <select
              className="tl-assign-select"
              value={selectedHelpCase}
              onChange={(event) => setSelectedHelpCase(event.target.value)}
            >
              <option value="" disabled>
                Select a case
              </option>
              {caseData.length === 0 ? (
                <option value="" disabled>No cases available</option>
              ) : (
                caseData.map((caseItem) => (
                  <option key={caseItem.firestoreId || caseItem.id} value={caseItem.id}>
                    {caseItem.id}{caseItem.priority ? ` - ${caseItem.priority}` : ""}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="tl-assign-field">
            <span className="tl-assign-label">Reason:</span>
            <textarea
              className="tl-assign-select"
              value={helpReason}
              onChange={(event) => setHelpReason(event.target.value)}
              placeholder="Describe why you need help..."
              rows="4"
              style={{
                resize: "vertical",
                fontFamily: "inherit",
                padding: "8px 12px",
              }}
            />
          </label>
          <div className="tl-assign-actions">
            <button className="tl-primary" type="button" onClick={handleSubmit} disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </button>
            <button
              className="tl-secondary"
              type="button"
              onClick={handleClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardAgentNeedHelp;
