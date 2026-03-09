import React from "react";
import "./CaseStatusDropdown.css";

/**
 * CaseStatusDropdown - A dropdown component for case status selection
 * @param {string} value - Current status value
 * @param {function} onChange - Callback when status changes (receives new status string)
 * @param {string} caseId - Case identifier for accessibility
 */
const CaseStatusDropdown = ({ value, onChange, caseId }) => {
  const statusOptions = [
    "Untouched",
    "Scheduled",
    "Closed",
    "Escalated",
    "Send Back",
    "Unassigned",
  ];

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <select
      className="case-status-dropdown"
      value={value || "Untouched"}
      onChange={handleChange}
      aria-label={`Status for case ${caseId}`}
    >
      {statusOptions.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
};

export default CaseStatusDropdown;
