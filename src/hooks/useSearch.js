import { useState, useMemo } from "react";

/**
 * Custom hook for search functionality
 * @param {Array} data - The data array to filter
 * @param {Function} filterFn - Function that takes (item, searchText) and returns boolean
 * @returns {Object} - { searchText, setSearchText, filteredData }
 */
function useSearch(data, filterFn) {
  const [searchText, setSearchText] = useState("");

  const filteredData = useMemo(() => {
    if (!searchText.trim()) return data;
    const search = searchText.toLowerCase();
    return data.filter((item) => filterFn(item, search));
  }, [data, searchText, filterFn]);

  return {
    searchText,
    setSearchText,
    filteredData,
  };
}

export default useSearch;
