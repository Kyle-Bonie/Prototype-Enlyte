import { useState, useEffect } from "react";
import ApricusLogo from "./assets/ApricusLogo.png";
import SearchBar from "./components/SearchBar";
import HelpRequestDetail from "./components/HelpRequestDetail";
import { PieChart, TATColumnChart } from "./components/DashboardTeamLeadCharts";
import NotificationCarousel from "./components/NotificationCarousel";
import useSearch from "./hooks/useSearch";
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from "./api/usersAPI";
import "./DashboardTeamLead.css";

function DashboardTeamLead({ username, onLogout }) {
  // View selection: controls Case Summary vs Case History panels.
  const [activeView, setActiveView] = useState("summary");
  // Upload modal visibility state.
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  // Upload validation error message.
  const [uploadError, setUploadError] = useState("");
  // Store uploaded file.
  const [uploadedFile, setUploadedFile] = useState(null);
  // Track drag state for visual feedback.
  const [isDragging, setIsDragging] = useState(false);
  // Manage User data list.
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  // Manage User form state.
  const [userForm, setUserForm] = useState({
    name: "",
    username: "",
    password: "",
    employeeNumber: "",
    role: "Agent",
  });
  // Manage User edit state.
  const [editingUserId, setEditingUserId] = useState(null);
  // Case selection state for Assign Case button.
  const [selectedCases, setSelectedCases] = useState({});
  // Assign Case modal state.
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("");
  // Selected notification row for detail panel.
  const [selectedNotification, setSelectedNotification] = useState(null);
  // Track read/unread status for notifications
  const [notificationReadStatus, setNotificationReadStatus] = useState({});
  // Track if notification page has been visited in this session
  const [notificationPageVisited, setNotificationPageVisited] = useState(false);
  // Pagination states
  const [agentSummaryPage, setAgentSummaryPage] = useState(1);
  const [caseTablePage, setCaseTablePage] = useState(1);
  const [historyAgentPage, setHistoryAgentPage] = useState(1);
  const [historyCasePage, setHistoryCasePage] = useState(1);
  const [manageUserPage, setManageUserPage] = useState(1);
  const itemsPerPage = 5;
  // Case data state - starts empty until file is uploaded
  const [caseData, setCaseData] = useState([]);

  // Static notification / help request data
  const STATIC_NOTIFICATIONS = [
    {
      id: 1,
      agent: "A. Cruz",
      caseNumber: "CS-2041",
      reason: "This is a test notification - Help request submitted",
      time: "5 mins ago",
    },
    {
      id: 2,
      agent: "J. Lim",
      caseNumber: "CS-2043",
      reason: "Test message - Agent needs assistance with document review",
      time: "12 mins ago",
    },
    {
      id: 3,
      agent: "S. Tan",
      caseNumber: "CS-2045",
      reason: "Sample help request for testing purposes",
      time: "18 mins ago",
    },
    {
      id: 4,
      agent: "M. Santos",
      caseNumber: "CS-2047",
      reason: "Test notification - Support needed for urgent case",
      time: "25 mins ago",
    },
  ];

  // Static data to populate when file is uploaded
  const STATIC_CASE_DATA = [
    {
      id: "CS-1042",
      date: "01/28/2026",
      agent: "A. Cruz",
      assignedTime: "09:00",
      priority: "Urgent",
      expectedTime: "13:00",
      touched: "12:20",
      touchedTimeFix: "12:30",
      status: "Met",
    },
    {
      id: "CS-1043",
      date: "01/28/2026",
      agent: "J. Lim",
      assignedTime: "09:00",
      priority: "Standard",
      expectedTime: "15:00",
      touched: "15:30",
      touchedTimeFix: "15:45",
      status: "Not Met",
    },
    {
      id: "CS-1044",
      date: "01/28/2026",
      agent: "S. Tan",
      assignedTime: "09:00",
      priority: "Standard",
      expectedTime: "16:00",
      touched: "14:10",
      touchedTimeFix: "14:20",
      status: "Met",
    },
    {
      id: "CS-1045",
      date: "01/28/2026",
      agent: "",
      assignedTime: "",
      priority: "Standard",
      expectedTime: "17:00",
      touched: "",
      touchedTimeFix: "",
      status: "Not Met",
    },
    {
      id: "CS-1046",
      date: "01/28/2026",
      agent: "",
      assignedTime: "",
      priority: "Urgent",
      expectedTime: "18:00",
      touched: "",
      touchedTimeFix: "",
      status: "Not Met",
    },
  ];

  // Load users from Firestore on mount
  useEffect(() => {
    const loadUsers = async () => {
      setUsersLoading(true);
      setUsersError("");
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (err) {
        setUsersError("Failed to load users.");
        console.error(err);
      } finally {
        setUsersLoading(false);
      }
    };
    loadUsers();
  }, []);

  // Sidebar navigation handler.
  const handleSelectView = (view) => {
    setActiveView(view);
    // Mark notification page as visited when opened
    if (view === "notification") {
      setNotificationPageVisited(true);
    }
  };

  // Page heading derived from current view.
  const headingText =
    activeView === "summary"
      ? "Case Summary"
      : activeView === "history"
        ? "Case History"
        : activeView === "notification"
          ? "Notifications"
          : "Manage User";

  // Excel file validation for upload modal.
  const validateAndSetFile = (file) => {
    if (!file) {
      setUploadError("");
      setUploadedFile(null);
      return;
    }

    const isExcel =
      file.type === "application/vnd.ms-excel" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      /\.(xls|xlsx)$/i.test(file.name);

    if (!isExcel) {
      setUploadError("Only Excel files (.xls, .xlsx) are allowed.");
      setUploadedFile(null);
      return;
    }

    setUploadError("");
    setUploadedFile(file);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    validateAndSetFile(file);
    if (!file || uploadError) {
      event.target.value = "";
    }
  };

  // Drag and drop handlers
  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  // Manage User form field handler.
  const handleUserFieldChange = (event) => {
    const { name, value } = event.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  // Create or update a user.
  const handleSaveUser = async (event) => {
    event.preventDefault();
    const trimmedName = userForm.name.trim();
    const trimmedUsername = userForm.username.trim();
    const trimmedEmployeeNumber = userForm.employeeNumber.trim();
    if (!trimmedName || !trimmedUsername || !trimmedEmployeeNumber) return;
    if (!editingUserId && !userForm.password.trim()) return;

    setUsersError("");
    try {
      if (editingUserId) {
        const updateData = {
          name: trimmedName,
          username: trimmedUsername,
          employeeNumber: trimmedEmployeeNumber,
          role: userForm.role,
        };
        if (userForm.password.trim()) {
          updateData.password = userForm.password.trim();
        }
        await updateUser(editingUserId, updateData);
      } else {
        await createUser({
          name: trimmedName,
          username: trimmedUsername,
          password: userForm.password.trim(),
          employeeNumber: trimmedEmployeeNumber,
          role: userForm.role,
        });
      }
      const refreshed = await getAllUsers();
      setUsers(refreshed);
      setUserForm({ name: "", username: "", password: "", employeeNumber: "", role: "Agent" });
      setEditingUserId(null);
    } catch (err) {
      setUsersError(err.message || "Failed to save user.");
    }
  };

  // Populate form for editing.
  const handleEditUser = (user) => {
    setUserForm({
      name: user.name,
      username: user.username,
      password: "",
      employeeNumber: user.employeeNumber || "",
      role: user.role,
    });
    setEditingUserId(user.id);
  };

  // Remove a user row.
  const handleDeleteUser = async (userId) => {
    setUsersError("");
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      if (editingUserId === userId) {
        setEditingUserId(null);
        setUserForm({ name: "", username: "", password: "", employeeNumber: "", role: "Agent" });
      }
    } catch (err) {
      setUsersError("Failed to delete user.");
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setUserForm({ name: "", username: "", password: "", employeeNumber: "", role: "Agent" });
  };

  const handleCaseToggle = (caseId) => {
    setSelectedCases((prev) => ({
      ...prev,
      [caseId]: !prev[caseId],
    }));
  };

  const hasSelectedCases = Object.values(selectedCases).some(Boolean);
  const availableAgents = users.filter((user) => user.role === "Agent");

  // Pagination helper functions
  const paginate = (items, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const totalPages = (items) => Math.ceil(items.length / itemsPerPage);

  // Agent summary data (for both Case Summary and Case History views) - starts empty
  const [agentSummaryData, setAgentSummaryData] = useState([]);

  // Static agent summary data to populate on upload
  const STATIC_AGENT_SUMMARY = [
    { name: "A. Cruz", assigned: 14, urgent: 3, intake: 6, total: 23 },
    { name: "J. Lim", assigned: 11, urgent: 2, intake: 7, total: 20 },
    { name: "S. Tan", assigned: 9, urgent: 1, intake: 5, total: 15 },
    { name: "M. Santos", assigned: 12, urgent: 4, intake: 8, total: 24 },
    { name: "R. Garcia", assigned: 10, urgent: 2, intake: 6, total: 18 },
    { name: "L. Reyes", assigned: 8, urgent: 1, intake: 4, total: 13 },
  ];

  // Case history data - starts empty
  const [caseHistoryData, setCaseHistoryData] = useState([]);

  // Static case history data to populate on upload
  const STATIC_CASE_HISTORY = [
    {
      id: "CS-1001",
      date: "01/20/2026",
      agent: "A. Cruz",
      assignedTime: "09:00",
      priority: "Urgent",
      expectedTime: "13:00",
      touched: "12:00",
      touchedTimeFix: "12:15",
      status: "Met",
    },
    {
      id: "CS-1002",
      date: "01/20/2026",
      agent: "J. Lim",
      assignedTime: "09:00",
      priority: "Standard",
      expectedTime: "15:00",
      touched: "16:00",
      touchedTimeFix: "16:10",
      status: "Not Met",
    },
    {
      id: "CS-1003",
      date: "01/21/2026",
      agent: "S. Tan",
      assignedTime: "09:00",
      priority: "Standard",
      expectedTime: "16:00",
      touched: "14:30",
      touchedTimeFix: "14:45",
      status: "Met",
    },
    {
      id: "CS-1004",
      date: "01/21/2026",
      agent: "A. Cruz",
      assignedTime: "09:00",
      priority: "Urgent",
      expectedTime: "13:00",
      touched: "12:30",
      touchedTimeFix: "12:40",
      status: "Met",
    },
    {
      id: "CS-1005",
      date: "01/22/2026",
      agent: "J. Lim",
      assignedTime: "09:00",
      priority: "Standard",
      expectedTime: "15:00",
      touched: "15:20",
      touchedTimeFix: "15:35",
      status: "Not Met",
    },
    {
      id: "CS-1006",
      date: "01/22/2026",
      agent: "M. Santos",
      assignedTime: "09:00",
      priority: "Urgent",
      expectedTime: "13:00",
      touched: "11:45",
      touchedTimeFix: "12:00",
      status: "Met",
    },
  ];

  // Search hooks for filtering data
  const caseSearch = useSearch(
    caseData,
    (caseItem, search) =>
      caseItem.id.toLowerCase().includes(search) ||
      caseItem.agent.toLowerCase().includes(search),
  );

  const agentSummarySearch = useSearch(agentSummaryData, (agent, search) =>
    agent.name.toLowerCase().includes(search),
  );

  const historyAgentSearch = useSearch(agentSummaryData, (agent, search) =>
    agent.name.toLowerCase().includes(search),
  );

  const caseHistorySearch = useSearch(
    caseHistoryData,
    (caseItem, search) =>
      caseItem.id.toLowerCase().includes(search) ||
      caseItem.agent.toLowerCase().includes(search),
  );

  const handleOpenAssign = () => {
    setIsAssignOpen(true);
  };

  const handleCloseAssign = () => {
    setIsAssignOpen(false);
    setSelectedAgent("");
  };

  const handleNotificationClick = (notif) => {
    // Mark as read when clicked
    setNotificationReadStatus((prev) => ({
      ...prev,
      [notif.id]: true,
    }));

    // Toggle selection (close if already selected)
    setSelectedNotification(
      selectedNotification?.id === notif.id ? null : notif
    );
  };

  const handleAssignConfirm = () => {
    if (!selectedAgent) {
      return;
    }

    // Update assigned cases with agent and complete data, but keep as "Not Met"
    setCaseData((prev) =>
      prev.map((caseItem) => {
        if (selectedCases[caseItem.id]) {
          return {
            ...caseItem,
            agent: selectedAgent,
            assignedTime: "09:00",
            touched: "15:30",
            touchedTimeFix: "15:45",
            status: "Not Met",
          };
        }
        return caseItem;
      }),
    );

    alert("Case/s is successfully assigned.");
    setSelectedCases({});
    handleCloseAssign();
  };

  return (
    <div className="tl-dashboard">
      {/* Fixed header bar */}
      <header className="tl-topbar">
        <img className="tl-topbar-logo" src={ApricusLogo} alt="Apricus" />
      </header>
      <div className="tl-body">
        {/* Sidebar navigation + logout */}
        <aside className="tl-sidebar sidebar">
          <nav className="tl-nav">
            <button
              className={`tl-nav-item${activeView === "summary" ? " active" : ""}`}
              type="button"
              onClick={() => handleSelectView("summary")}
            >
              <span className="tl-nav-icon" aria-hidden="true">
                ▦
              </span>
              <span className="tl-nav-text">Case Summary</span>
            </button>
            <button
              className={`tl-nav-item${activeView === "history" ? " active" : ""}`}
              type="button"
              onClick={() => handleSelectView("history")}
            >
              <span className="tl-nav-icon" aria-hidden="true">
                🕘
              </span>
              <span className="tl-nav-text">Case History</span>
            </button>
            <button
              className={`tl-nav-item${activeView === "notification" ? " active" : ""}`}
              type="button"
              onClick={() => handleSelectView("notification")}
            >
              <span className="tl-nav-icon" aria-hidden="true">
                🔔
              </span>
              <span className="tl-nav-text">Notification</span>
            </button>
            <button
              className={`tl-nav-item${activeView === "manage" ? " active" : ""}`}
              type="button"
              onClick={() => handleSelectView("manage")}
            >
              <span className="tl-nav-icon" aria-hidden="true">
                👥
              </span>
              <span className="tl-nav-text">Manage User</span>
            </button>
          </nav>
          <div className="tl-sidebar-spacer" />
          <button className="tl-logout" type="button" onClick={onLogout}>
            Logout
          </button>
        </aside>
        <main className="tl-main">
          <NotificationCarousel
            isVisible={!notificationPageVisited}
            onNotificationClick={() => handleSelectView("notification")}
          />
          <div className="tl-content">
            <h1 className="tl-title">{headingText}</h1>
            <p className="tl-subtitle">Welcome, Team Lead.</p>
            {/* Case Summary view */}
            {activeView === "summary" ? (
              <>
                {/* First row: Upload Excel tile */}
                <div className="tl-tiles">
                  <section className="tl-tile">
                    <div className="tl-tile-header">
                      <h2 className="tl-tile-title">Upload Excel</h2>
                    </div>
                    <button
                      className="tl-upload-button"
                      type="button"
                      // Opens the upload modal.
                      onClick={() => setIsUploadOpen(true)}
                    >
                      Upload File
                    </button>
                  </section>
                </div>
                {/* Second row: Both charts side by side */}
                <div className="tl-tiles">
                  {/* TAT Column Chart */}
                  <section className="tl-tile">
                    <div className="tl-tile-header">
                      <h2 className="tl-tile-title">
                        Met and Not Met Cases Count
                      </h2>
                    </div>
                    <TATColumnChart data={caseData} />
                  </section>
                  {/* Agent workload pie chart */}
                  <section className="tl-tile">
                    <div className="tl-tile-header">
                      <h2 className="tl-tile-title">
                        Agent Workload Distribution
                      </h2>
                    </div>
                    <PieChart data={agentSummaryData} />
                  </section>
                </div>
                {/* Agent summary table tile */}
                <section className="tl-tile tl-table-tile">
                  <div className="tl-tile-header">
                    <h2 className="tl-tile-title">Agent Summary Table</h2>
                  </div>
                  <SearchBar
                    value={agentSummarySearch.searchText}
                    onChange={agentSummarySearch.setSearchText}
                    placeholder="Search by Agent Name..."
                  />
                  <div className="tl-table-wrap">
                    <table className="tl-table tl-table--summary">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Assigned</th>
                          <th>Urgent</th>
                          <th>Intake</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agentSummarySearch.filteredData.length === 0 ? (
                          <tr>
                            <td
                              colSpan="5"
                              style={{
                                textAlign: "center",
                                padding: "40px",
                                color: "#999",
                                fontStyle: "italic",
                              }}
                            >
                              No Available Data
                            </td>
                          </tr>
                        ) : (
                          paginate(
                            agentSummarySearch.filteredData,
                            agentSummaryPage,
                          ).map((agent, index) => (
                            <tr key={index}>
                              <td>{agent.name}</td>
                              <td>{agent.assigned}</td>
                              <td>{agent.urgent}</td>
                              <td>{agent.intake}</td>
                              <td>{agent.total}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td>Total</td>
                          <td>
                            {agentSummarySearch.filteredData.reduce(
                              (sum, a) => sum + a.assigned,
                              0,
                            )}
                          </td>
                          <td>
                            {agentSummarySearch.filteredData.reduce(
                              (sum, a) => sum + a.urgent,
                              0,
                            )}
                          </td>
                          <td>
                            {agentSummarySearch.filteredData.reduce(
                              (sum, a) => sum + a.intake,
                              0,
                            )}
                          </td>
                          <td>
                            {agentSummarySearch.filteredData.reduce(
                              (sum, a) => sum + a.total,
                              0,
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="tl-pagination">
                    <button
                      className="tl-pagination-btn"
                      onClick={() =>
                        setAgentSummaryPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={agentSummaryPage === 1}
                    >
                      Previous
                    </button>
                    <span className="tl-pagination-info">
                      Page {agentSummaryPage} of{" "}
                      {totalPages(agentSummarySearch.filteredData)}
                    </span>
                    <button
                      className="tl-pagination-btn"
                      onClick={() =>
                        setAgentSummaryPage((prev) =>
                          Math.min(
                            totalPages(agentSummarySearch.filteredData),
                            prev + 1,
                          ),
                        )
                      }
                      disabled={
                        agentSummaryPage ===
                        totalPages(agentSummarySearch.filteredData)
                      }
                    >
                      Next
                    </button>
                  </div>
                </section>
                {/* Case table tile */}
                <section className="tl-tile tl-table-tile">
                  <div className="tl-tile-header">
                    <h2 className="tl-tile-title">Case Table</h2>
                  </div>
                  <div className="tl-search-container">
                    <SearchBar
                      bare={true}
                      value={caseSearch.searchText}
                      onChange={caseSearch.setSearchText}
                      placeholder="Search by Case Number or Agent..."
                    />
                    <button
                      className="tl-assign-button"
                      type="button"
                      disabled={!hasSelectedCases}
                      onClick={handleOpenAssign}
                    >
                      Assign Case
                    </button>
                  </div>
                  <div className="tl-table-wrap">
                    <table className="tl-table">
                      <thead>
                        <tr>
                          <th aria-label="Select" />
                          <th>Date</th>
                          <th>Case Number</th>
                          <th>Agent</th>
                          <th>Assigned Time (9AM) EST</th>
                          <th>Priority</th>
                          <th>EXCPECTED TIME (EST)</th>
                          <th>Touched (EST)</th>
                          <th>Touched Time Fix (EST)</th>
                          <th>Met/Not Met TAT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {caseSearch.filteredData.length === 0 ? (
                          <tr>
                            <td
                              colSpan="10"
                              style={{
                                textAlign: "center",
                                padding: "40px",
                                color: "#999",
                                fontStyle: "italic",
                              }}
                            >
                              No Available Data
                            </td>
                          </tr>
                        ) : (
                          paginate(caseSearch.filteredData, caseTablePage).map(
                            (caseItem) => (
                              <tr
                                key={caseItem.id}
                                className={`tl-row ${
                                  caseItem.status === "Met"
                                    ? "tl-row--met"
                                    : "tl-row--missed"
                                }`}
                              >
                                <td>
                                  {caseItem.status === "Not Met" ? (
                                    <input
                                      type="checkbox"
                                      aria-label={`Select case ${caseItem.id}`}
                                      checked={!!selectedCases[caseItem.id]}
                                      onChange={() =>
                                        handleCaseToggle(caseItem.id)
                                      }
                                    />
                                  ) : null}
                                </td>
                                <td>{caseItem.date}</td>
                                <td>{caseItem.id}</td>
                                <td>{caseItem.agent}</td>
                                <td>{caseItem.assignedTime}</td>
                                <td>{caseItem.priority}</td>
                                <td>{caseItem.expectedTime}</td>
                                <td>{caseItem.touched}</td>
                                <td>{caseItem.touchedTimeFix}</td>
                                <td
                                  className={`tl-status ${
                                    caseItem.status === "Met"
                                      ? "tl-status--met"
                                      : "tl-status--missed"
                                  }`}
                                >
                                  {caseItem.status}
                                </td>
                              </tr>
                            ),
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="tl-pagination">
                    <button
                      className="tl-pagination-btn"
                      onClick={() =>
                        setCaseTablePage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={caseTablePage === 1}
                    >
                      Previous
                    </button>
                    <span className="tl-pagination-info">
                      Page {caseTablePage} of{" "}
                      {totalPages(caseSearch.filteredData)}
                    </span>
                    <button
                      className="tl-pagination-btn"
                      onClick={() =>
                        setCaseTablePage((prev) =>
                          Math.min(
                            totalPages(caseSearch.filteredData),
                            prev + 1,
                          ),
                        )
                      }
                      disabled={
                        caseTablePage === totalPages(caseSearch.filteredData)
                      }
                    >
                      Next
                    </button>
                  </div>
                </section>
              </>
            ) : activeView === "history" ? (
              <>
                {/* Case History view tiles */}
                <div className="tl-tiles">
                  <section className="tl-tile">
                    <div className="tl-tile-header">
                      <h2 className="tl-tile-title">Chart Preview</h2>
                    </div>
                    <div className="tl-chart">
                      <div className="tl-chart-bar" />
                      <div className="tl-chart-bar" />
                      <div className="tl-chart-bar" />
                      <div className="tl-chart-bar" />
                    </div>
                  </section>
                </div>
                {/* Agent history table for history view */}
                <section className="tl-tile tl-table-tile">
                  <div className="tl-tile-header">
                    <h2 className="tl-tile-title">Agent History Table</h2>
                  </div>
                  <SearchBar
                    value={historyAgentSearch.searchText}
                    onChange={historyAgentSearch.setSearchText}
                    placeholder="Search by Agent Name..."
                  />
                  <div className="tl-table-wrap">
                    <table className="tl-table tl-table--summary">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Assigned</th>
                          <th>Urgent</th>
                          <th>Intake</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyAgentSearch.filteredData.length === 0 ? (
                          <tr>
                            <td
                              colSpan="5"
                              style={{
                                textAlign: "center",
                                padding: "40px",
                                color: "#999",
                                fontStyle: "italic",
                              }}
                            >
                              No Available Data
                            </td>
                          </tr>
                        ) : (
                          paginate(
                            historyAgentSearch.filteredData,
                            historyAgentPage,
                          ).map((agent, index) => (
                            <tr key={index}>
                              <td>{agent.name}</td>
                              <td>{agent.assigned}</td>
                              <td>{agent.urgent}</td>
                              <td>{agent.intake}</td>
                              <td>{agent.total}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td>Total</td>
                          <td>
                            {historyAgentSearch.filteredData.reduce(
                              (sum, a) => sum + a.assigned,
                              0,
                            )}
                          </td>
                          <td>
                            {historyAgentSearch.filteredData.reduce(
                              (sum, a) => sum + a.urgent,
                              0,
                            )}
                          </td>
                          <td>
                            {historyAgentSearch.filteredData.reduce(
                              (sum, a) => sum + a.intake,
                              0,
                            )}
                          </td>
                          <td>
                            {historyAgentSearch.filteredData.reduce(
                              (sum, a) => sum + a.total,
                              0,
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="tl-pagination">
                    <button
                      className="tl-pagination-btn"
                      onClick={() =>
                        setHistoryAgentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={historyAgentPage === 1}
                    >
                      Previous
                    </button>
                    <span className="tl-pagination-info">
                      Page {historyAgentPage} of{" "}
                      {totalPages(historyAgentSearch.filteredData)}
                    </span>
                    <button
                      className="tl-pagination-btn"
                      onClick={() =>
                        setHistoryAgentPage((prev) =>
                          Math.min(
                            totalPages(historyAgentSearch.filteredData),
                            prev + 1,
                          ),
                        )
                      }
                      disabled={
                        historyAgentPage ===
                        totalPages(historyAgentSearch.filteredData)
                      }
                    >
                      Next
                    </button>
                  </div>
                </section>
                {/* Case History table */}
                <section className="tl-tile tl-table-tile">
                  <div className="tl-tile-header">
                    <h2 className="tl-tile-title">Case History Table</h2>
                  </div>
                  <SearchBar
                    value={caseHistorySearch.searchText}
                    onChange={caseHistorySearch.setSearchText}
                    placeholder="Search by Case Number or Agent..."
                  />
                  <div className="tl-table-wrap">
                    <table className="tl-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Case Number</th>
                          <th>Agent</th>
                          <th>Assigned Time (9AM) EST</th>
                          <th>Priority</th>
                          <th>EXCPECTED TIME (EST)</th>
                          <th>Touched (EST)</th>
                          <th>Touched Time Fix (EST)</th>
                          <th>Met/Not Met TAT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {caseHistorySearch.filteredData.length === 0 ? (
                          <tr>
                            <td
                              colSpan="9"
                              style={{
                                textAlign: "center",
                                padding: "40px",
                                color: "#999",
                                fontStyle: "italic",
                              }}
                            >
                              No Available Data
                            </td>
                          </tr>
                        ) : (
                          paginate(
                            caseHistorySearch.filteredData,
                            historyCasePage,
                          ).map((caseItem) => (
                            <tr
                              key={caseItem.id}
                              className={`tl-row ${
                                caseItem.status === "Met"
                                  ? "tl-row--met"
                                  : "tl-row--missed"
                              }`}
                            >
                              <td>{caseItem.date}</td>
                              <td>{caseItem.id}</td>
                              <td>{caseItem.agent}</td>
                              <td>{caseItem.assignedTime}</td>
                              <td>{caseItem.priority}</td>
                              <td>{caseItem.expectedTime}</td>
                              <td>{caseItem.touched}</td>
                              <td>{caseItem.touchedTimeFix}</td>
                              <td
                                className={`tl-status ${
                                  caseItem.status === "Met"
                                    ? "tl-status--met"
                                    : "tl-status--missed"
                                }`}
                              >
                                {caseItem.status}
                              </td>
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
                        setHistoryCasePage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={historyCasePage === 1}
                    >
                      Previous
                    </button>
                    <span className="tl-pagination-info">
                      Page {historyCasePage} of{" "}
                      {totalPages(caseHistorySearch.filteredData)}
                    </span>
                    <button
                      className="tl-pagination-btn"
                      x
                      onClick={() =>
                        setHistoryCasePage((prev) =>
                          Math.min(
                            totalPages(caseHistorySearch.filteredData),
                            prev + 1,
                          ),
                        )
                      }
                      disabled={
                        historyCasePage ===
                        totalPages(caseHistorySearch.filteredData)
                      }
                    >
                      Next
                    </button>
                  </div>
                </section>
              </>
            ) : activeView === "notification" ? (
              <>
                {/* Notification view - Help Request Table */}
                <section className="tl-tile tl-table-tile">
                  <div className="tl-tile-header">
                    <h2 className="tl-tile-title">Help Requests from Agents</h2>
                  </div>
                  <div className="tl-table-wrap">
                    <table className="tl-table tl-table--notification">
                      <thead>
                        <tr>
                          <th>Agent Name</th>
                          <th>Case Number</th>
                          <th>Reason</th>
                          <th>Time Requested</th>
                        </tr>
                      </thead>
                      <tbody>
                        {STATIC_NOTIFICATIONS.map((notif) => {
                          const isRead = notificationReadStatus[notif.id];
                          const isActive = selectedNotification?.id === notif.id;
                          return (
                            <tr
                              key={notif.id}
                              className={`tl-notif-row${isActive ? " tl-notif-row--active" : ""}${!isRead ? " tl-notif-row--unread" : ""}`}
                              onClick={() => handleNotificationClick(notif)}
                              style={{ cursor: "pointer" }}
                            >
                              <td className="tl-notification-agent">
                                {!isRead && <span className="tl-unread-indicator" aria-label="Unread">●</span>}
                                {notif.agent}
                              </td>
                              <td className="tl-notification-case">{notif.caseNumber}</td>
                              <td className="tl-notification-reason">{notif.reason}</td>
                              <td className="tl-notification-time">{notif.time}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
                {/* Help Request Detail Panel */}
                {selectedNotification && (
                  <HelpRequestDetail
                    request={selectedNotification}
                    agents={availableAgents}
                    onClose={() => setSelectedNotification(null)}
                  />
                )}
              </>
            ) : (
              <>
                {/* Manage User view */}
                <section className="tl-tile tl-manage-tile">
                  <div className="tl-tile-header">
                    <h2 className="tl-tile-title">Manage User</h2>
                  </div>
                  <form className="tl-user-form" onSubmit={handleSaveUser}>
                    {usersError && (
                      <p style={{ color: "#dc2626", fontSize: "13px", margin: "0 0 8px" }}>{usersError}</p>
                    )}
                    <div className="tl-form-grid">
                      <label className="tl-form-field">
                        <span className="tl-form-label">Employee Number</span>
                        <input
                          className="tl-form-input"
                          type="text"
                          name="employeeNumber"
                          value={userForm.employeeNumber}
                          onChange={handleUserFieldChange}
                          placeholder="e.g. EMP-003"
                          required
                        />
                      </label>
                      <label className="tl-form-field">
                        <span className="tl-form-label">Name</span>
                        <input
                          className="tl-form-input"
                          type="text"
                          name="name"
                          value={userForm.name}
                          onChange={handleUserFieldChange}
                          placeholder="Enter full name"
                          required
                        />
                      </label>
                      <label className="tl-form-field">
                        <span className="tl-form-label">Username</span>
                        <input
                          className="tl-form-input"
                          type="text"
                          name="username"
                          value={userForm.username}
                          onChange={handleUserFieldChange}
                          placeholder="Enter username"
                          required
                        />
                      </label>
                      <label className="tl-form-field">
                        <span className="tl-form-label">
                          {editingUserId ? "New Password (leave blank to keep)" : "Password"}
                        </span>
                        <input
                          className="tl-form-input"
                          type="password"
                          name="password"
                          value={userForm.password}
                          onChange={handleUserFieldChange}
                          placeholder={editingUserId ? "Leave blank to keep current" : "Enter password"}
                          required={!editingUserId}
                        />
                      </label>
                      <label className="tl-form-field">
                        <span className="tl-form-label">Role</span>
                        <select
                          className="tl-form-input"
                          name="role"
                          value={userForm.role}
                          onChange={handleUserFieldChange}
                        >
                          <option value="Agent">Agent</option>
                          <option value="Team Lead">Team Lead</option>
                        </select>
                      </label>
                    </div>
                    <div className="tl-form-actions">
                      <button className="tl-primary" type="submit">
                        {editingUserId ? "Update User" : "Add User"}
                      </button>
                      {editingUserId ? (
                        <button
                          className="tl-secondary"
                          type="button"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </form>
                </section>
                <section className="tl-tile tl-table-tile">
                  <div className="tl-tile-header">
                    <h2 className="tl-tile-title">User List</h2>
                  </div>
                  <div className="tl-table-wrap">
                    <table className="tl-table tl-table--manage">
                      <thead>
                        <tr>
                          <th>Emp. No.</th>
                          <th>Name</th>
                          <th>Username</th>
                          <th>Role</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersLoading ? (
                          <tr>
                            <td colSpan="5" style={{ textAlign: "center", padding: "30px", color: "#999" }}>
                              Loading users...
                            </td>
                          </tr>
                        ) : users.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ textAlign: "center", padding: "30px", color: "#999", fontStyle: "italic" }}>
                              No users found
                            </td>
                          </tr>
                        ) : (
                          paginate(users, manageUserPage).map((user) => (
                            <tr key={user.id}>
                              <td>{user.employeeNumber}</td>
                              <td>{user.name}</td>
                              <td>{user.username}</td>
                              <td>{user.role}</td>
                              <td>
                                <div className="tl-action-buttons">
                                  <button
                                    className="tl-link"
                                    type="button"
                                    onClick={() => handleEditUser(user)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="tl-link tl-link--danger"
                                    type="button"
                                    onClick={() => handleDeleteUser(user.id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
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
                        setManageUserPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={manageUserPage === 1}
                    >
                      Previous
                    </button>
                    <span className="tl-pagination-info">
                      Page {manageUserPage} of {totalPages(users)}
                    </span>
                    <button
                      className="tl-pagination-btn"
                      onClick={() =>
                        setManageUserPage((prev) =>
                          Math.min(totalPages(users), prev + 1),
                        )
                      }
                      disabled={manageUserPage === totalPages(users)}
                    >
                      Next
                    </button>
                  </div>
                </section>
              </>
            )}
          </div>
        </main>
      </div>
      {/* Upload modal */}
      {isUploadOpen ? (
        <div className="tl-modal" role="dialog" aria-modal="true">
          <div
            className="tl-modal-backdrop"
            // Click backdrop to close modal.
            onClick={() => setIsUploadOpen(false)}
          />
          <div className="tl-modal-card">
            <button
              className="tl-modal-close"
              type="button"
              // Close modal button.
              onClick={() => setIsUploadOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div
              className={`tl-upload-box${isDragging ? " tl-upload-box--dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="tl-upload-icon" aria-hidden="true">
                ⬆️
              </div>
              <p className="tl-upload-text">
                Drag Excel file here to upload or
              </p>
              <label className="tl-upload-choose">
                Choose file
                <input
                  className="tl-upload-input"
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={handleFileChange}
                />
              </label>
              {uploadError ? (
                <p className="tl-upload-error">{uploadError}</p>
              ) : null}
              {uploadedFile ? (
                <div className="tl-upload-file-info">
                  <div className="tl-upload-file-details">
                    <div>
                      <p className="tl-upload-file-name">
                        ✓ {uploadedFile.name}
                      </p>
                      <p className="tl-upload-file-size">
                        {(uploadedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      className="tl-upload-remove"
                      type="button"
                      onClick={() => {
                        setUploadedFile(null);
                        setUploadError("");
                        const input =
                          document.querySelector(".tl-upload-input");
                        if (input) input.value = "";
                      }}
                      aria-label="Remove file"
                    >
                      Remove
                    </button>
                    <button
                      className="tl-upload-save"
                      type="button"
                      onClick={() => {
                        // Populate all tables with static data
                        setCaseData(STATIC_CASE_DATA);
                        setAgentSummaryData(STATIC_AGENT_SUMMARY);
                        setCaseHistoryData(STATIC_CASE_HISTORY);

                        alert(
                          `File "${uploadedFile.name}" saved successfully!`,
                        );
                        setUploadedFile(null);
                        setUploadError("");
                        setIsUploadOpen(false);
                        const input =
                          document.querySelector(".tl-upload-input");
                        if (input) input.value = "";
                      }}
                      aria-label="Save file"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      {isAssignOpen ? (
        <div className="tl-modal" role="dialog" aria-modal="true">
          <div className="tl-modal-backdrop" onClick={handleCloseAssign} />
          <div className="tl-modal-card">
            <button
              className="tl-modal-close"
              type="button"
              onClick={handleCloseAssign}
              aria-label="Close"
            >
              ×
            </button>
            <div className="tl-assign-box">
              <h3 className="tl-assign-title">Assign Selected Cases</h3>
              <p className="tl-assign-text">Select one agent to assign.</p>
              <label className="tl-assign-field">
                <span className="tl-assign-label">Agent</span>
                <select
                  className="tl-assign-select"
                  value={selectedAgent}
                  onChange={(event) => setSelectedAgent(event.target.value)}
                >
                  <option value="" disabled>
                    Select an agent
                  </option>
                  {availableAgents.map((agent) => (
                    <option key={agent.id} value={agent.name}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="tl-assign-actions">
                <button
                  className="tl-primary"
                  type="button"
                  disabled={!selectedAgent}
                  onClick={handleAssignConfirm}
                >
                  Okay
                </button>
                <button
                  className="tl-secondary"
                  type="button"
                  onClick={handleCloseAssign}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DashboardTeamLead;
