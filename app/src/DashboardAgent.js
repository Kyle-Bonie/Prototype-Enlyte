import { useState, useEffect, useRef, useCallback } from "react";
import ApricusLogo from "./assets/ApricusLogo.png";
import DashboardAgentNeedHelp from "./components/DashboardAgentNeedHelp";
import MyRequests from "./components/MyRequests";
import { subscribeCases, submitHelpRequest, updateCasesStatus } from "./api/casesAPI";
import { subscribeAgentHelpRequests } from "./api/helpRequestsAPI";
import { getUserByUsername } from "./api/usersAPI";
import { HEADER_MAP, normalise } from "./utils/excelParser";
import DashboardAgentChart from "./components/DashboardAgentChart";
import SearchBar from "./components/SearchBar";
import useSearch from "./hooks/useSearch";
import "./DashboardAgent.css";
import "./components/MyRequests.css";

// ─── Module-level constants ────────────────────────────────────────────────────
// Default deadline from assignment time: 4 hours in seconds
const DEADLINE_SECONDS = 4 * 60 * 60;
const ITEMS_PER_PAGE = 5;
const NOTIFICATION_SOUND =
  "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZijcIF2m98OScTgwPUKfj8LZjHAY4ktjyzXksBS";

const formatTime = (seconds) => {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const paginate = (items, page) => {
  const start = (page - 1) * ITEMS_PER_PAGE;
  return items.slice(start, start + ITEMS_PER_PAGE);
};

const formatDateRange = (range) => {
  const today = new Date();
  const fmt = (d) => {
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const dy = String(d.getDate()).padStart(2, "0");
    return `${mo}/${dy}/${d.getFullYear()}`;
  };
  switch (range) {
    case "today":
      return fmt(today);
    case "thisWeek": {
      const s = new Date(today);
      s.setDate(today.getDate() - today.getDay());
      return `${fmt(s)} – ${fmt(today)}`;
    }
    case "thisMonth":
      return `${fmt(new Date(today.getFullYear(), today.getMonth(), 1))} – ${fmt(today)}`;
    case "last7Days": {
      const s = new Date(today);
      s.setDate(today.getDate() - 7);
      return `${fmt(s)} – ${fmt(today)}`;
    }
    case "last30Days": {
      const s = new Date(today);
      s.setDate(today.getDate() - 30);
      return `${fmt(s)} – ${fmt(today)}`;
    }
    default:
      return fmt(today);
  }
};

function DashboardAgent({ username, onLogout }) {
  // ── View ───────────────────────────────────────────────────────────────────
  const [activeView, setActiveView] = useState("cases");
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState("today");

  // ── Live case data from Firestore ─────────────────────────────────────────
  const [allCases, setAllCases] = useState([]);
  const [caseHeaders, setCaseHeaders] = useState([]);
  const [agentName, setAgentName] = useState("");
  const [caseStatuses, setCaseStatuses] = useState({});
  const [selectedCases, setSelectedCases] = useState({});

  // ── Notification & modal state ────────────────────────────────────────────
  const [newCases, setNewCases] = useState([]);       // newly assigned cases
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [modalRemainingTime, setModalRemainingTime] = useState(0);

  // ── Other ─────────────────────────────────────────────────────────────────
  const [isNeedHelpOpen, setIsNeedHelpOpen] = useState(false);
  const [helpPreSelectedCaseId, setHelpPreSelectedCaseId] = useState("");

  // ── My Requests ───────────────────────────────────────────────────────────
  const [myRequests, setMyRequests] = useState([]);
  const [replyToast, setReplyToast] = useState(null); // { caseNumber, repliedBy, reply }
  const [unreadReplies, setUnreadReplies] = useState(0);
  // null = not yet initialised; Set<string> = request IDs that already had a reply
  const knownRepliedIdsRef = useRef(null);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const agentNameRef = useRef("");
  // null = first load not yet done; Set<string> = IDs seen on previous snapshot
  const knownCaseIdsRef = useRef(null);
  const audioRef = useRef(null);
  const soundIntervalRef = useRef(null);

  // ── Audio helpers ─────────────────────────────────────────────────────────
  const stopAudio = useCallback(() => {
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  const startAudio = useCallback(() => {
    stopAudio();
    const audio = new Audio(NOTIFICATION_SOUND);
    audio.volume = 0.7;
    audio.play().catch(() => {});
    soundIntervalRef.current = setInterval(() => {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }, 2000);
    audioRef.current = audio;
  }, [stopAudio]);

  // ── Cleanup audio on unmount ──────────────────────────────────────────────
  useEffect(() => () => stopAudio(), [stopAudio]);

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

  // ── Subscribe to this agent's help requests in real-time ──────────────────
  useEffect(() => {
    if (!username) return;
    const unsub = subscribeAgentHelpRequests(username, (requests) => {
      setMyRequests(requests);

      // Detect brand-new replies (status flipped to "replied" or "reassigned")
      const replied = requests.filter(
        (r) => r.status === "replied" || r.status === "reassigned"
      );

      if (knownRepliedIdsRef.current === null) {
        // First load — baseline, no toast
        knownRepliedIdsRef.current = new Set(replied.map((r) => r.id));
        return;
      }

      const incoming = replied.filter(
        (r) => !knownRepliedIdsRef.current.has(r.id)
      );

      if (incoming.length > 0) {
        knownRepliedIdsRef.current = new Set(replied.map((r) => r.id));
        setReplyToast(incoming[0]);
        setUnreadReplies((prev) => prev + incoming.length);
      }
    });
    return () => unsub();
  }, [username]);

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
      ).length / ITEMS_PER_PAGE
    )
  );

  // Merge optimistic local status overrides so the chart reflects
  // "Mark as Done" instantly without waiting for Firestore round-trip.
  const chartData = myCases.map((c) => ({
    ...c,
    status: caseStatuses[c.firestoreId] ?? c.status,
  }));

  const headingText =
    activeView === "summary"  ? "Summary"     :
    activeView === "requests" ? "My Requests" :
    "My Cases";

  // ── Detect newly assigned cases → show modal + audio + toast ────────────
  useEffect(() => {
    if (!effectiveName || myCases.length === 0) return;

    const currentIds = new Set(myCases.map((c) => c.firestoreId));

    // First load — check if any cases were recently assigned (last 5 minutes)
    if (knownCaseIdsRef.current === null) {
      const now = Date.now();
      const recentThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      const recentlyAssigned = myCases.filter((c) => {
        const assignedAt = c.assignedAt?.toDate?.();
        if (!assignedAt) return false;
        return (now - assignedAt.getTime()) < recentThreshold;
      });

      knownCaseIdsRef.current = currentIds;

      // Show modal if there are recently assigned cases
      if (recentlyAssigned.length > 0) {
        setNewCases(recentlyAssigned);
        setShowModal(true);
        setShowToast(true);

        // Compute remaining time from Firestore assignedAt timestamp
        const assignedAt = recentlyAssigned[0].assignedAt?.toDate?.();
        if (assignedAt) {
          const elapsed = Math.floor((now - assignedAt.getTime()) / 1000);
          setModalRemainingTime(Math.max(0, DEADLINE_SECONDS - elapsed));
        } else {
          setModalRemainingTime(DEADLINE_SECONDS);
        }

        startAudio();

        if ("Notification" in window) {
          Notification.requestPermission().then((perm) => {
            if (perm === "granted") {
              new Notification("You Have An Unfinished Case", {
                body: `${recentlyAssigned.length} new case(s) assigned to you.`,
                icon: "/EnlyteLogo.png",
                tag: "case-assignment",
              });
            }
          });
        }
      }
      return;
    }

    const incoming = myCases.filter(
      (c) => !knownCaseIdsRef.current.has(c.firestoreId)
    );
    if (incoming.length === 0) return;

    knownCaseIdsRef.current = currentIds;
    setNewCases(incoming);
    setShowModal(true);
    setShowToast(true);

    // Compute remaining time from Firestore assignedAt timestamp
    const assignedAt = incoming[0].assignedAt?.toDate?.();
    if (assignedAt) {
      const elapsed = Math.floor((Date.now() - assignedAt.getTime()) / 1000);
      setModalRemainingTime(Math.max(0, DEADLINE_SECONDS - elapsed));
    } else {
      setModalRemainingTime(DEADLINE_SECONDS);
    }

    startAudio();

    if ("Notification" in window) {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          new Notification("You Have An Unfinished Case", {
            body: `${incoming.length} new case(s) assigned to you.`,
            icon: "/EnlyteLogo.png",
            tag: "case-assignment",
          });
        }
      });
    }
  // effectiveName and myCases are the reactive deps; others are stable refs/callbacks
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myCases, effectiveName]);

  // ── Modal countdown timer (only runs while modal is open) ────────────────
  useEffect(() => {
    if (!showModal) return;
    const timer = setInterval(
      () => setModalRemainingTime((prev) => Math.max(0, prev - 1)),
      1000
    );
    return () => clearInterval(timer);
  }, [showModal]);

  // ── Stop audio when modal closes ──────────────────────────────────────────
  useEffect(() => {
    if (!showModal) stopAudio();
  }, [showModal, stopAudio]);

  const handleCaseToggle = (caseId) => {
    setSelectedCases((prev) => ({ ...prev, [caseId]: !prev[caseId] }));
  };

  const hasSelectedCases = Object.values(selectedCases).some(Boolean);

  const handleMarkAsDone = async () => {
    const statusHeaderKey =
      caseHeaders.find((h) => HEADER_MAP[normalise(h)] === "status") ?? null;

    const checkedIds = Object.keys(selectedCases).filter((id) => selectedCases[id]);
    const firestoreUpdates = checkedIds.map((firestoreId) => {
      const caseItem = myCases.find((c) => c.firestoreId === firestoreId);
      return { firestoreId, currentRaw: caseItem?._raw ?? {}, statusHeaderKey };
    });

    const updatedStatuses = { ...caseStatuses };
    checkedIds.forEach((id) => { updatedStatuses[id] = "Met"; });
    setCaseStatuses(updatedStatuses);
    setSelectedCases({});

    try {
      await updateCasesStatus(firestoreUpdates);
    } catch (err) {
      console.error("Failed to update case status:", err);
    }
  };


  // Only closeable via "In Progress" — no cancel / backdrop dismiss
  const handleModalInProgress = () => {
    setShowModal(false);
    setNewCases([]);
  };

  // Helper: resolve a _raw value by HEADER_MAP field type.
  // Returns "—" when the header is missing OR the stored value is empty.
  const getRawValue = (caseItem, fieldType) => {
    const key = caseHeaders.find((h) => HEADER_MAP[normalise(h)] === fieldType);
    if (!key) return "—";
    const val = caseItem._raw?.[key];
    return (val !== undefined && val !== null && val !== "") ? String(val) : "—";
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
            <button
              className={`tl-nav-item${activeView === "requests" ? " active" : ""}`}
              type="button"
              onClick={() => {
                setActiveView("requests");
                setUnreadReplies(0);
              }}
            >
              <span className="tl-nav-icon" aria-hidden="true">💬</span>
              <span className="tl-nav-text">My Requests</span>
              {unreadReplies > 0 && (
                <span className="mr-nav-badge">{unreadReplies}</span>
              )}
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
            {activeView === "requests" ? (
              <section className="tl-tile tl-table-tile">
                <div className="tl-tile-header">
                  <h2 className="tl-tile-title">My Help Requests</h2>
                  <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                    {myRequests.length} request{myRequests.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <MyRequests requests={myRequests} />
              </section>
            ) : activeView === "summary" ? (
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
                        {formatDateRange(dateRange)}
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
      {showModal && newCases.length > 0 && (
        <div className="agent-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          {/* Backdrop is non-dismissible — only "In Progress" closes the modal */}
          <div className="agent-modal-backdrop" />
          <div className="agent-modal-card">
            <h2 className="agent-modal-title" id="modal-title">You have an unfinished case</h2>
            <p className="agent-modal-text">
              You have {newCases.length === 1 ? "a new case" : `${newCases.length} new cases`} assigned to you. Please review below.
            </p>
            <div className="agent-modal-table">
              <div className="agent-modal-row agent-modal-row--header">
                <span>Date</span>
                <span>Case Number</span>
                <span>Assigned Time (9AM) EST</span>
                <span>Met / Not Met TAT</span>
              </div>
              {newCases.map((caseItem, idx) => {
                const currentStatus = caseStatuses[caseItem.firestoreId] ?? caseItem.status;
                const assignedDate = (() => {
                  // 1st choice: Firestore assignment timestamp
                  const d = caseItem.assignedAt?.toDate?.();
                  if (d) {
                    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
                  }
                  // 2nd choice: Excel "date" column
                  const raw = getRawValue(caseItem, "date");
                  if (raw !== "—") return raw;
                  // 3rd choice: today's date (case is being assigned now)
                  const now = new Date();
                  return `${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}/${now.getFullYear()}`;
                })();
                const assignedTime = (() => {
                  // 1st choice: Firestore assignment timestamp → actual time
                  const d = caseItem.assignedAt?.toDate?.();
                  if (d) {
                    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "America/New_York" }) + " EST";
                  }
                  // 2nd choice: Excel "assignedTime" column
                  const raw = getRawValue(caseItem, "assignedTime");
                  if (raw !== "—") return raw;
                  // 3rd choice: cases are always slotted as 9AM EST
                  return "09:00 AM EST";
                })();
                return (
                  <div className="agent-modal-row" key={caseItem.firestoreId}>
                    <span>{assignedDate}</span>
                    <span>{getRawValue(caseItem, "id")}</span>
                    <span>{assignedTime}</span>
                    <span className={`agent-modal-status ${currentStatus === "Met" ? "agent-modal-status--met" : "agent-modal-status--missed"}`}>
                      {currentStatus}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="agent-modal-actions">
              <button
                className="agent-modal-button agent-modal-button--primary"
                type="button"
                onClick={handleModalInProgress}
              >
                In Progress
              </button>
              <button
                className="agent-modal-button agent-modal-button--secondary"
                type="button"
                onClick={() => {
                  const preId = newCases.length > 0 ? getRawValue(newCases[0], "id") : "";
                  handleModalInProgress();
                  setHelpPreSelectedCaseId(preId);
                  setIsNeedHelpOpen(true);
                }}
              >
                I Need Help
              </button>
            </div>
          </div>
        </div>
      )}
      <DashboardAgentNeedHelp
        isOpen={isNeedHelpOpen}
        onClose={() => {
          setIsNeedHelpOpen(false);
          setHelpPreSelectedCaseId("");
        }}
        caseData={myCases}
        caseHeaders={caseHeaders}
        preSelectedCaseId={helpPreSelectedCaseId}
        onSubmit={async ({ caseId, reason }) => {
          await submitHelpRequest({ caseId, reason, agentUsername: username });
        }}
      />
      {/* ── Reply toast ── */}
      {replyToast && (
        <div className="mr-reply-toast" role="alert">
          <div className="mr-reply-toast-header">
            <span className="mr-reply-toast-title">
              💬 Team Lead Replied
            </span>
          </div>
          <p className="mr-reply-toast-body">
            Reply received for case <strong>{replyToast.caseNumber || "—"}</strong>
            {replyToast.repliedBy ? ` from ${replyToast.repliedBy}` : ""}.
          </p>
          <button
            className="mr-reply-toast-action"
            type="button"
            onClick={() => {
              setReplyToast(null);
              setUnreadReplies(0);
              setActiveView("requests");
            }}
          >
            View My Requests
          </button>
        </div>
      )}
      {showToast && newCases.length > 0 && (
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
            <h3 className="agent-toast-title">You have an unfinished case</h3>
            <p className="agent-toast-body">
              {newCases.length === 1
                ? `Case ${getRawValue(newCases[0], "id")} has been assigned to you.`
                : `${newCases.length} new cases have been assigned to you.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardAgent;
