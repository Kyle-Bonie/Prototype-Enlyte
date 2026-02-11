import { useState } from "react";
import ApricusLogo from "./assets/ApricusLogo.png";
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
  const [users, setUsers] = useState([
    { id: 1, name: "A. Cruz", role: "Agent", status: "Active" },
    { id: 2, name: "J. Lim", role: "Agent", status: "Active" },
    { id: 3, name: "S. Tan", role: "Team Lead", status: "Inactive" },
  ]);
  // Manage User form state.
  const [userForm, setUserForm] = useState({
    name: "",
    role: "Agent",
    status: "Active",
  });
  // Manage User edit state.
  const [editingUserId, setEditingUserId] = useState(null);
  // Case selection state for Assign Case button.
  const [selectedCases, setSelectedCases] = useState({});
  // Assign Case modal state.
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("");
  // Case data state
  const [caseData, setCaseData] = useState([
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
  ]);

  // Sidebar navigation handler.
  const handleSelectView = (view) => {
    setActiveView(view);
  };

  // Page heading derived from current view.
  const headingText =
    activeView === "summary"
      ? "Case Summary"
      : activeView === "history"
        ? "Case History"
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
  const handleSaveUser = (event) => {
    event.preventDefault();
    const trimmedName = userForm.name.trim();
    if (!trimmedName) {
      return;
    }

    if (editingUserId) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === editingUserId
            ? { ...user, ...userForm, name: trimmedName }
            : user,
        ),
      );
    } else {
      setUsers((prev) => {
        const nextId = Math.max(0, ...prev.map((user) => user.id)) + 1;
        return [
          ...prev,
          {
            id: nextId,
            name: trimmedName,
            role: userForm.role,
            status: userForm.status,
          },
        ];
      });
    }

    setUserForm({ name: "", role: "Agent", status: "Active" });
    setEditingUserId(null);
  };

  // Populate form for editing.
  const handleEditUser = (user) => {
    setUserForm({ name: user.name, role: user.role, status: user.status });
    setEditingUserId(user.id);
  };

  // Remove a user row.
  const handleDeleteUser = (userId) => {
    setUsers((prev) => prev.filter((user) => user.id !== userId));
    if (editingUserId === userId) {
      setEditingUserId(null);
      setUserForm({ name: "", role: "Agent", status: "Active" });
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setUserForm({ name: "", role: "Agent", status: "Active" });
  };

  const handleCaseToggle = (caseId) => {
    setSelectedCases((prev) => ({
      ...prev,
      [caseId]: !prev[caseId],
    }));
  };

  const hasSelectedCases = Object.values(selectedCases).some(Boolean);
  const availableAgents = users.filter((user) => user.role === "Agent");

  const handleOpenAssign = () => {
    setIsAssignOpen(true);
  };

  const handleCloseAssign = () => {
    setIsAssignOpen(false);
    setSelectedAgent("");
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
          <div className="tl-content">
            <h1 className="tl-title">{headingText}</h1>
            <p className="tl-subtitle">Welcome, {username}.</p>
            {/* Case Summary view */}
            {activeView === "summary" ? (
              <>
                {/* Summary tiles row */}
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
                  {/* Placeholder chart tile */}
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
                {/* Agent summary table tile */}
                <section className="tl-tile tl-table-tile">
                  <div className="tl-tile-header">
                    <h2 className="tl-tile-title">Agent Summary Table</h2>
                  </div>
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
                        <tr>
                          <td>A. Cruz</td>
                          <td>14</td>
                          <td>3</td>
                          <td>6</td>
                          <td>23</td>
                        </tr>
                        <tr>
                          <td>J. Lim</td>
                          <td>11</td>
                          <td>2</td>
                          <td>7</td>
                          <td>20</td>
                        </tr>
                        <tr>
                          <td>S. Tan</td>
                          <td>9</td>
                          <td>1</td>
                          <td>5</td>
                          <td>15</td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr>
                          <td>Total</td>
                          <td>34</td>
                          <td>6</td>
                          <td>18</td>
                          <td>58</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </section>
                {/* Case table tile */}
                <section className="tl-tile tl-table-tile">
                  <div className="tl-tile-header">
                    <h2 className="tl-tile-title">Case Table</h2>
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
                        {caseData.map((caseItem) => (
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
                                  onChange={() => handleCaseToggle(caseItem.id)}
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
                        ))}
                      </tbody>
                    </table>
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
                {/* Agent summary table for history view */}
                <section className="tl-tile tl-table-tile">
                  <div className="tl-tile-header">
                    <h2 className="tl-tile-title">Agent Summary Table</h2>
                  </div>
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
                        <tr>
                          <td>A. Cruz</td>
                          <td>14</td>
                          <td>3</td>
                          <td>6</td>
                          <td>23</td>
                        </tr>
                        <tr>
                          <td>J. Lim</td>
                          <td>11</td>
                          <td>2</td>
                          <td>7</td>
                          <td>20</td>
                        </tr>
                        <tr>
                          <td>S. Tan</td>
                          <td>9</td>
                          <td>1</td>
                          <td>5</td>
                          <td>15</td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr>
                          <td>Total</td>
                          <td>34</td>
                          <td>6</td>
                          <td>18</td>
                          <td>58</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </section>
              </>
            ) : (
              <>
                {/* Manage User view */}
                <section className="tl-tile tl-manage-tile">
                  <div className="tl-tile-header">
                    <h2 className="tl-tile-title">Manage User</h2>
                  </div>
                  <form className="tl-user-form" onSubmit={handleSaveUser}>
                    <div className="tl-form-grid">
                      <label className="tl-form-field">
                        <span className="tl-form-label">Name</span>
                        <input
                          className="tl-form-input"
                          type="text"
                          name="name"
                          value={userForm.name}
                          onChange={handleUserFieldChange}
                          placeholder="Enter name"
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
                      <label className="tl-form-field">
                        <span className="tl-form-label">Status</span>
                        <select
                          className="tl-form-input"
                          name="status"
                          value={userForm.status}
                          onChange={handleUserFieldChange}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
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
                          <th>Name</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td>{user.name}</td>
                            <td>{user.role}</td>
                            <td>
                              <span
                                className={`tl-pill ${
                                  user.status === "Active"
                                    ? "tl-pill--active"
                                    : "tl-pill--inactive"
                                }`}
                              >
                                {user.status}
                              </span>
                            </td>
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
                        ))}
                      </tbody>
                    </table>
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
}

export default DashboardTeamLead;
