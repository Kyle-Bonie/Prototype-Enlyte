import React from "react";
import "./RowsPerPageSelector.css";

/**
 * RowsPerPageSelector Component
 * 
 * A modern dropdown selector for pagination row limits.
 * 
 * @param {number} value - Current rows per page value
 * @param {function} onChange - Callback function when value changes
 * @param {array} options - Array of row limit options (default: [10, 20, 50, 100])
 */
function RowsPerPageSelector({ value, onChange, options = [10, 20, 50, 100] }) {
  return (
    <div className="rows-per-page-selector">
      <label htmlFor="rows-per-page" className="rows-per-page-label">
        Rows per page:
      </label>
      <select
        id="rows-per-page"
        className="rows-per-page-select"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export default RowsPerPageSelector;
