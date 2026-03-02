import { useState, useEffect, useRef } from "react";
import ApricusLogo from "./assets/ApricusLogo.png";
import DashboardAgentNeedHelp from "./components/DashboardAgentNeedHelp";
import { subscribeCases, submitHelpRequest, updateCasesStatus } from "./api/casesAPI";
import { getUserByUsername } from "./api/usersAPI";
import { HEADER_MAP, normalise } from "./utils/excelParser";
import DashboardAgentChart from "./components/DashboardAgentChart";
import SearchBar from "./components/SearchBar";
import useSearch from "./hooks/useSearch";
import "./DashboardAgent.css";

function DashboardAgent({ username, onLogout }) {
  const [activeView, setActiveView] = useState("cases");
  const [showAssignedModal, setShowAssignedModal] = useState(true);
  const [selectedCases, setSelectedCases] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [remainingTime, setRemainingTime] = useState(4 * 60 * 60); // 4 hours in seconds
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [caseStatuses, setCaseStatuses] = useState({});
  const [isNeedHelpOpen, setIsNeedHelpOpen] = useState(false);
  const [dateRange, setDateRange] = useState("today");
  // Live cases from Firestore
  const [allCases, setAllCases] = useState([]);
  const [caseHeaders, setCaseHeaders] = useState([]);
  // The agent's display name (used to filter cases assigned to them)
  const [agentName, setAgentName] = useState("");
  // Ref keeps the resolved name available synchronously inside callbacks
  const agentNameRef = useRef("");

  // Resolve agent display name first, THEN subscribe so the filter is never
  // run with an empty name on the initial Firestore snapshot.
  useEffect(() => {
    let unsub = () => {};

    const init = async () => {
      try {
        const user = await getUserByUsername(username);
        const name = user?.name ?? username;
        agentNameRef.current = name;
        setAgentName(name);
      } catch {
        agentNameRef.current = username;
        setAgentName(username);
      }

      unsub = subscribeCases(({ cases, headers }) => {
        setAllCases(cases);
        setCaseHeaders(headers);
      });
    };

    init();
    return () => unsub();
  }, [username]);

  // Helper function to calculate date ranges
  const getDateRange = (range) => {
    const today = new Date();
    const formatDate = (date) => {
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    };

    switch (range) {
      case "today":
        return formatDate(today);
      case "thisWeek": {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return `${formatDate(startOfWeek)} - ${formatDate(today)}`;
      }
      case "thisMonth": {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return `${formatDate(startOfMonth)} - ${formatDate(today)}`;
      }
      case "last7Days": {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        return `${formatDate(sevenDaysAgo)} - ${formatDate(today)}`;
      }
      case "last30Days": {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        return `${formatDate(thirtyDaysAgo)} - ${formatDate(today)}`;
      }
      default:
        return formatDate(today);
    }
  };

  // Cases assigned to this agent — filter by top-level `agent` field
  // (written by team lead via updateCasesAgent). Also falls back to checking
  // the _raw agent column so the filter always uses the correct name.
  const effectiveName = agentName || agentNameRef.current;
  const myCases = effectiveName
    ? allCases.filter((c) => {
        if (c.agent && c.agent === effectiveName) return true;
        // Fallback: check _raw agent column
        const agentHeaderKey = caseHeaders.find(
          (h) => HEADER_MAP[normalise(h)] === "agent"
        );
        return agentHeaderKey
          ? (c._raw?.[agentHeaderKey] ?? "") === effectiveName
          : false;
      })
    : [];

  // Pagination helper functions
  const paginate = (items, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  // Shared filter: search across all _raw values
  const rawFilter = (item, search) =>
    Object.values(item._raw ?? {}).some((v) =>
      String(v).toLowerCase().includes(search)
    );

  // Search for Case Table (My Cases view)
  const caseTableSearch = useSearch(myCases, rawFilter);
  // Search for My Cases Summary table
  const summarySearch = useSearch(myCases, rawFilter);

  const totalPages = Math.max(
    1,
    Math.ceil(
      (activeView === "summary"
        ? summarySearch.filteredData
        : caseTableSearch.filteredData
      ).length / itemsPerPage
    )
  );

  // Merge optimistic local status overrides so the chart reflects
  // "Mark as Done" instantly without waiting for Firestore round-trip.
  const chartData = myCases.map((c) => ({
    ...c,
    status: caseStatuses[c.firestoreId] ?? c.status,
  }));

  const headingText = activeView === "summary" ? "Summary" : "My Cases";

  useEffect(() => {
    // Delay all notifications to 10 seconds
    const notificationTimeout = setTimeout(() => {
      // Set notification badge in browser tab
      document.title = "(1) Enlyte Tracking System";

      // Show custom toast notification
      setShowToast(true);

      // Request and show native Windows notification
      if ("Notification" in window) {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            // Play notification sound
            const audio = new Audio(
              "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZijcIF2m98OScTgwPUKfj8LZjHAY4ktjyzXksBS",
            );
            audio.volume = 0.7;

            // Play sound immediately
            audio.play().catch((e) => console.log("Audio play failed:", e));

            // Loop sound every 5 seconds
            const soundInterval = setInterval(() => {
              audio.currentTime = 0;
              audio.play().catch((e) => console.log("Audio play failed:", e));
            }, 2000);

            // Store interval ID for cleanup
            window.agentSoundInterval = soundInterval;

            new Notification("New Case Assigned", {
              body: "You have a new case assigned: CS-2101",
              icon: "/EnlyteLogo.png",
              badge: "/EnlyteLogo.png",
              tag: "case-assignment",
              requireInteraction: false,
            });
          }
        });
      }

      // Create red notification badge on favicon
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext("2d");

      // Load the original favicon
      const img = new Image();
      img.onload = () => {
        // Draw original favicon
        ctx.drawImage(img, 0, 0, 32, 32);

        // Draw red badge circle
        ctx.fillStyle = "#dc2626";
        ctx.beginPath();
        ctx.arc(24, 8, 10, 0, 2 * Math.PI);
        ctx.fill();

        // Draw white border around badge
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(24, 8, 10, 0, 2 * Math.PI);
        ctx.stroke();

        // Draw notification count
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("1", 24, 8);

        // Update favicon
        const link =
          document.querySelector("link[rel*='icon']") ||
          document.createElement("link");
        link.type = "image/png";
        link.rel = "icon";
        link.href = canvas.toDataURL();
        document.head.appendChild(link);
      };
      img.src = "/EnlyteLogo.png";
    }, 3000); // 3 seconds delay for all notifications

    // Clean up when component unmounts
    return () => {
      document.title = "Enlyte Tracking System";
      const link = document.querySelector("link[rel*='icon']");
      if (link) {
        link.href = "/EnlyteLogo.png";
      }
      // Clear notification timeout if component unmounts before notifications show
      clearTimeout(notificationTimeout);
      // Clear sound interval
      if (window.agentSoundInterval) {
        clearInterval(window.agentSoundInterval);
        window.agentSoundInterval = null;
      }
    };
  }, []);

  // Countdown timer for remaining time
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format remaining time as HH:MM:SS
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCaseToggle = (caseId) => {
    setSelectedCases((prev) => ({
      ...prev,
      [caseId]: !prev[caseId],
    }));
  };

  const hasSelectedCases = Object.values(selectedCases).some(Boolean);

  const handleMarkAsDone = async () => {
    // Find which header key represents the status column
    const statusHeaderKey = caseHeaders.find(
      (h) => HEADER_MAP[normalise(h)] === "status"
    ) ?? null;

    // Build Firestore update payload for each ticked case
    const checkedIds = Object.keys(selectedCases).filter((id) => selectedCases[id]);
    const firestoreUpdates = checkedIds.map((firestoreId) => {
      const caseItem = myCases.find((c) => c.firestoreId === firestoreId);
      return { firestoreId, currentRaw: caseItem?._raw ?? {}, statusHeaderKey };
    });

    // Optimistic local update so the row turns green immediately
    const updatedStatuses = { ...caseStatuses };
    checkedIds.forEach((id) => { updatedStatuses[id] = "Met"; });
    setCaseStatuses(updatedStatuses);
    setSelectedCases({});

    // Persist to Firestore — real-time listener will propagate to team lead
    try {
      await updateCasesStatus(firestoreUpdates);
    } catch (err) {
      console.error("Failed to update case status:", err);
    }
  };

  const handleCloseModal = () => {
    setShowAssignedModal(false);
    // Stop the notification sound when modal is closed
    if (window.agentSoundInterval) {
      clearInterval(window.agentSoundInterval);
      window.agentSoundInterval = null;
    }
  };

  return (
    <div className="agent-dashboard">
      <header className="tl-topbar">
        <img className="tl-topbar-logo" src={ApricusLogo} alt="Apricus" />
      </header>
      <div className="agent-body">
        <aside className="tl-sidebar sidebar">
          <nav className="tl-nav">
            <button
              className={`tl-nav-item${activeView === "cases" ? " active" : ""}`}
              type="button"
              onClick={() => setActiveView("cases")}
            >
              <span className="tl-nav-icon" aria-hidden="true">
                ▦
              </span>
              <span className="tl-nav-text">My Cases</span>
            </button>
            <button
              className={`tl-nav-item${activeView === "summary" ? " active" : ""}`}
              type="button"
              onClick={() => setActiveView("summary")}
            >
              <span className="tl-nav-icon" aria-hidden="true">
                📋
              </span>
              <span className="tl-nav-text">Summary</span>
            </button>
          </nav>
          <div className="tl-sidebar-spacer" />
          <button className="tl-logout" type="button" onClick={onLogout}>
            Logout
          </button>
        </aside>
        <main className="agent-main">
          <div className="agent-content">
            <h1 className="agent-title">{headingText}</h1>
            <p className="agent-subtitle">Welcome, {username}.</p>
            {activeView === "summary" ? (
              <>
                <section className="tl-tile tl-table-tile">
                  <div className="tl-tile-header">
                    <h2 className="tl-tile-title">My Cases Summary</h2>
                    <div className="agent-date-range">
                      <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="agent-date-selector"
                      >
                        <option value="today">Today</option>
                        <option value="thisWeek">This Week</option>
                        <option value="thisMonth">This Month</option>
                        <option value="last7Days">Last 7 Days</option>
                        <option value="last30Days">Last 30 Days</option>
                      </select>
                      <span className="agent-date-display">
                        {getDateRange(dateRange)}
                      </span>
                    </div>
                  </div>
                  <SearchBar
                    value={summarySearch.searchText}
                    onChange={(val) => { summarySearch.setSearchText(val); setCurrentPage(1); }}
                    placeholder="Search cases..."
                  />
                  <div className="tl-table-wrap">
                    <table className="tl-table">
                      <thead>
                        <tr>
                          {caseHeaders.map((header) => (
                            <th key={header}>{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {summarySearch.filteredData.length === 0 ? (
                          <tr>
                            <td
                              colSpan={caseHeaders.length || 8}
                              style={{ textAlign: "center", padding: "40px", color: "#999", fontStyle: "italic" }}
                            >
                              {myCases.length === 0 ? "No cases assigned to you yet." : "No matching cases found."}
                            </td>
                          </tr>
                        ) : (
                          paginate(summarySearch.filteredData, currentPage).map((caseItem) => (
                            <tr
                              key={caseItem.firestoreId}
                              className={`tl-row ${
                                caseItem.status === "Met" ? "tl-row--met" : "tl-row--missed"
                              }`}
                            >
                              {caseHeaders.map((header) => {
                                const isStatusCol = HEADER_MAP[normalise(header)] === "status";
                                return (
                                  <td
                                    key={header}
                                    className={isStatusCol ? `tl-status ${caseItem.status === "Met" ? "tl-status--met" : "tl-status--missed"}` : ""}
                                  >
                                    {caseItem._raw?.[header] ?? ""}
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="tl-pagination">
                    <button
                      className="tl-pagination-btn"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    <span className="tl-pagination-info">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      className="tl-pagination-btn"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                </section>
                <DashboardAgentChart data={chartData} />
              </>
            ) : (
              <section className="tl-tile tl-table-tile">
                <div className="tl-tile-header">
                  <h2 className="tl-tile-title">Case Table</h2>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="tl-assign-button"
                      type="button"
                      disabled={!hasSelectedCases}
                      onClick={handleMarkAsDone}
                    >
                      Mark as Done
                    </button>
                    <button
                      className="tl-assign-button"
                      type="button"
                      style={{ background: "#dc2626" }}
                      onClick={() => setIsNeedHelpOpen(true)}
                    >
                      Need Help?
                    </button>
                  </div>
                </div>
                <SearchBar
                  value={caseTableSearch.searchText}
                  onChange={(val) => { caseTableSearch.setSearchText(val); setCurrentPage(1); }}
                  placeholder="Search cases..."
                />
                <div className="tl-table-wrap">
                  <table className="tl-table">
                    <thead>
                      <tr>
                        <th aria-label="Select" />
                        {caseHeaders.map((header) => (
                          <th key={header}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {caseTableSearch.filteredData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={caseHeaders.length + 1 || 9}
                            style={{ textAlign: "center", padding: "40px", color: "#999", fontStyle: "italic" }}
                          >
                            {myCases.length === 0 ? "No cases assigned to you yet." : "No matching cases found."}
                          </td>
                        </tr>
                      ) : (
                        paginate(caseTableSearch.filteredData, currentPage).map((caseItem) => {
                          const currentStatus = caseStatuses[caseItem.firestoreId] || caseItem.status;
                          return (
                            <tr
                              key={caseItem.firestoreId}
                              className={`tl-row ${
                                currentStatus === "Met" ? "tl-row--met" : "tl-row--missed"
                              }`}
                            >
                              <td>
                                {currentStatus !== "Met" ? (
                                  <input
                                    type="checkbox"
                                    aria-label={`Select case ${caseItem.id}`}
                                    checked={!!selectedCases[caseItem.firestoreId]}
                                    onChange={() => handleCaseToggle(caseItem.firestoreId)}
                                  />
                                ) : null}
                              </td>
                              {caseHeaders.map((header) => {
                                const isStatusCol = HEADER_MAP[normalise(header)] === "status";
                                return (
                                  <td
                                    key={header}
                                    className={isStatusCol ? `tl-status ${currentStatus === "Met" ? "tl-status--met" : "tl-status--missed"}` : ""}
                                  >
                                    {isStatusCol ? currentStatus : (caseItem._raw?.[header] ?? "")}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="tl-pagination">
                  <button
                    className="tl-pagination-btn"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="tl-pagination-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="tl-pagination-btn"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
      {showAssignedModal ? (
        <div className="agent-modal" role="dialog" aria-modal="true">
          <div className="agent-modal-backdrop" onClick={handleCloseModal} />
          <div className="agent-modal-card">
            <h2 className="agent-modal-title">New Assigned Case</h2>
            <p className="agent-modal-text">
              You have a case assigned to you. Please review the details below.
            </p>
            <div className="agent-modal-table">
              <div className="agent-modal-row agent-modal-row--header">
                <span>Date</span>
                <span>Case Number</span>
                <span>Assigned Time (9AM) EST</span>
                <span>Met/Not Met TAT</span>
                <span>Remaining Time</span>
              </div>
              <div className="agent-modal-row">
                <span>02/02/2026</span>
                <span>CS-2101</span>
                <span>09:00</span>
                <span className="agent-modal-status agent-modal-status--missed">
                  Not Met
                </span>
                <span className="agent-modal-remaining">
                  {formatTime(remainingTime)}
                </span>
              </div>
            </div>
            <div className="agent-modal-actions">
              <button
                className="agent-modal-button agent-modal-button--primary"
                type="button"
                onClick={handleCloseModal}
              >
                In Progress
              </button>
              <button
                className="agent-modal-button agent-modal-button--secondary"
                type="button"
                onClick={handleCloseModal}
              >
                I need Help
              </button>
              <button
                className="agent-modal-button agent-modal-button--ghost"
                type="button"
                onClick={handleCloseModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <DashboardAgentNeedHelp
        isOpen={isNeedHelpOpen}
        onClose={() => setIsNeedHelpOpen(false)}
        caseData={myCases}
        onSubmit={async ({ caseId, reason }) => {
          await submitHelpRequest({ caseId, reason, agentUsername: username });
        }}
      />
      {showToast ? (
        <div className="agent-toast">
          <div className="agent-toast-content">
            <button
              className="agent-toast-close"
              type="button"
              onClick={() => setShowToast(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="agent-toast-title">New Case Assigned</h3>
            <p className="agent-toast-body">
              You have a new case assigned: CS-2101
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default DashboardAgent;
