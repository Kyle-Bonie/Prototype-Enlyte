import { useState } from "react";
import "./ClearDataButton.css";

function ClearDataButton({ onClear, disabled = false }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmClear = async () => {
    setIsClearing(true);
    try {
      await onClear();
      setShowConfirm(false);
    } catch (error) {
      console.error("Failed to clear data:", error);
      alert("Failed to clear data. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <>
      <button
        className="clear-data-button"
        type="button"
        onClick={handleClearClick}
        disabled={disabled || isClearing}
        title="Clear all uploaded case data"
      >
        <svg
          className="clear-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
        {isClearing ? "Clearing..." : "Clear Data"}
      </button>

      {showConfirm && (
        <div className="confirm-modal-overlay" onClick={handleCancel}>
          <div
            className="confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-modal-header">
              <svg
                className="confirm-warning-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h3>Clear All Case Data?</h3>
            </div>
            <p className="confirm-modal-message">
              This will permanently delete all uploaded case data from the
              system. This action cannot be undone.
            </p>
            <div className="confirm-modal-actions">
              <button
                className="confirm-cancel-button"
                onClick={handleCancel}
                disabled={isClearing}
              >
                Cancel
              </button>
              <button
                className="confirm-delete-button"
                onClick={handleConfirmClear}
                disabled={isClearing}
              >
                {isClearing ? "Clearing..." : "Yes, Clear Data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ClearDataButton;
