import React from "react";

function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  bare = false,
}) {
  const input = (
    <input
      type="text"
      className="tl-search-input"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );

  // If bare mode, return just the input without the container wrapper
  if (bare) {
    return input;
  }

  // Otherwise, wrap in container
  return <div className="tl-search-container">{input}</div>;
}

export default SearchBar;
