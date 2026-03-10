import { useState, useRef, useEffect } from "react";
import "./ProviderNameCell.css";

/**
 * ProviderNameCell - An inline editable cell for provider names
 * 
 * @param {string} value - Current provider name
 * @param {Function} onChange - Callback(newValue) when value is saved
 * @param {boolean} readOnly - If true, displays as read-only text (for Team Lead)
 * @param {string} caseId - Case identifier for accessibility
 */
function ProviderNameCell({ value = "", onChange, readOnly = false, caseId }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef(null);

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEdit = () => {
    if (readOnly) return;
    setIsEditing(true);
  };

  const handleSave = async () => {
    const trimmedValue = localValue.trim();
    
    // If value hasn't changed, just exit edit mode
    if (trimmedValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onChange(trimmedValue);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save provider name:", err);
      // Revert to original value on error
      setLocalValue(value);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    // Small delay to allow button clicks to register
    setTimeout(() => {
      if (isEditing && !isSaving) {
        handleSave();
      }
    }, 150);
  };

  // Read-only mode for Team Lead
  if (readOnly) {
    return (
      <div className="provider-name-cell provider-name-cell--readonly">
        {value || <span className="provider-name-cell__empty">—</span>}
      </div>
    );
  }

  // Edit mode for Agent
  if (isEditing) {
    return (
      <div className="provider-name-cell provider-name-cell--editing">
        <input
          ref={inputRef}
          type="text"
          className="provider-name-cell__input"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="Enter provider name"
          disabled={isSaving}
          aria-label={`Provider name for case ${caseId}`}
        />
        <div className="provider-name-cell__actions">
          <button
            type="button"
            className="provider-name-cell__btn provider-name-cell__btn--save"
            onClick={handleSave}
            disabled={isSaving}
            aria-label="Save"
            title="Save (Enter)"
          >
            ✓
          </button>
          <button
            type="button"
            className="provider-name-cell__btn provider-name-cell__btn--cancel"
            onClick={handleCancel}
            disabled={isSaving}
            aria-label="Cancel"
            title="Cancel (Esc)"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  // Display mode with edit button
  return (
    <div className="provider-name-cell provider-name-cell--display">
      <span className="provider-name-cell__text">
        {value || <span className="provider-name-cell__placeholder">Add provider</span>}
      </span>
      <button
        type="button"
        className="provider-name-cell__edit-btn"
        onClick={handleEdit}
        aria-label="Edit provider name"
        title="Edit provider name"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
    </div>
  );
}

export default ProviderNameCell;
