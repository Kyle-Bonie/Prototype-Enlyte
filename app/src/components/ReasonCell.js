import "./ReasonCell.css";

/**
 * ReasonCell - A clickable cell component for case reasons
 * Displays "Add Reason", "Modify Reason", or "View Reason" based on state
 * 
 * @param {string} value - Current reason text
 * @param {Function} onClick - Callback when cell is clicked
 * @param {boolean} readOnly - If true, shows "View Reason" (for Team Lead)
 */
function ReasonCell({ value = "", onClick, readOnly = false }) {
  const hasReason = Boolean(value && value.trim());
  
  let displayText = "Add Reason";
  let className = "reason-cell reason-cell--add";
  
  if (readOnly) {
    displayText = "View Reason";
    className = "reason-cell reason-cell--view";
  } else if (hasReason) {
    displayText = "Modify Reason";
    className = "reason-cell reason-cell--modify";
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-label={displayText}
    >
      <svg className="reason-cell__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {readOnly ? (
          // Eye icon for "View"
          <>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </>
        ) : hasReason ? (
          // Edit icon for "Modify"
          <>
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </>
        ) : (
          // Plus icon for "Add"
          <>
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </>
        )}
      </svg>
      <span className="reason-cell__text">{displayText}</span>
    </button>
  );
}

export default ReasonCell;
