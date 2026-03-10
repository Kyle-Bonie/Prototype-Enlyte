import { useState, useEffect } from "react";
import "./ReasonModal.css";

/**
 * ReasonModal - A modal component for viewing/editing case reasons
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {Function} onClose - Callback when modal closes
 * @param {Function} onSave - Callback(newReason) when reason is saved (edit mode only)
 * @param {string} currentReason - Current reason text
 * @param {string} caseId - Case identifier for display
 * @param {boolean} readOnly - If true, modal is view-only (for Team Lead)
 */
function ReasonModal({ isOpen, onClose, onSave, currentReason = "", caseId, readOnly = false }) {
  const [reason, setReason] = useState(currentReason);
  const [isSaving, setIsSaving] = useState(false);

  // Update local state when currentReason prop changes
  useEffect(() => {
    setReason(currentReason);
  }, [currentReason]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setReason(currentReason);
      setIsSaving(false);
    }
  }, [isOpen, currentReason]);

  const handleSave = async () => {
    if (readOnly || !onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(reason.trim());
      onClose();
    } catch (err) {
      console.error("Failed to save reason:", err);
      alert("Failed to save reason. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="reason-modal" onClick={handleBackdropClick}>
      <div className="reason-modal__content">
        <div className="reason-modal__header">
          <h2 className="reason-modal__title">
            {readOnly ? "View Reason" : (currentReason ? "Modify Reason" : "Add Reason")}
          </h2>
          <button
            className="reason-modal__close"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            ×
          </button>
        </div>

        <div className="reason-modal__body">
          <div className="reason-modal__case-info">
            <label className="reason-modal__label">Case Number</label>
            <div className="reason-modal__case-id">{caseId}</div>
          </div>

          {readOnly && !currentReason ? (
            <div className="reason-modal__empty-state">
              <svg className="reason-modal__empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <p className="reason-modal__empty-message">
                The reason for this case has not been added yet.
              </p>
            </div>
          ) : (
            <div className="reason-modal__field">
              <label className="reason-modal__label" htmlFor="reason-textarea">
                Reason
              </label>
              <textarea
                id="reason-textarea"
                className="reason-modal__textarea"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={readOnly ? "" : "Enter the reason for this case..."}
                readOnly={readOnly}
                rows={6}
              />
            </div>
          )}
        </div>

        <div className="reason-modal__footer">
          {readOnly ? (
            <button
              className="reason-modal__button reason-modal__button--secondary"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          ) : (
            <>
              <button
                className="reason-modal__button reason-modal__button--secondary"
                onClick={onClose}
                disabled={isSaving}
                type="button"
              >
                Cancel
              </button>
              <button
                className="reason-modal__button reason-modal__button--primary"
                onClick={handleSave}
                disabled={isSaving || !reason.trim()}
                type="button"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReasonModal;
