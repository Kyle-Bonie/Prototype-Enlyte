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
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setUploadError("");
      return;
    }

    const isExcel =
      file.type === "application/vnd.ms-excel" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      /\.(xls|xlsx)$/i.test(file.name);

    if (!isExcel) {
      setUploadError("Only Excel files (.xls, .xlsx) are allowed.");
      event.target.value = "";
      return;
    }

    setUploadError("");
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
                      <p className="tl-tile-subtitle">
                        Upload a .xls or .xlsx file
                      </p>
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
                      <p className="tl-tile-subtitle">
                        Visualization placeholder
                      </p>
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
                    <p className="tl-tile-subtitle">
                      Workload snapshot by agent
                    </p>
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
                    <p className="tl-tile-subtitle">
                      Sample data for visualization
                    </p>
                  </div>
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
                        <tr>
                          <td>01/28/2026</td>
                          <td>CS-1042</td>
                          <td>A. Cruz</td>
                          <td>09:00</td>
                          <td>High</td>
                          <td>13:00</td>
                          <td>12:20</td>
                          <td>12:30</td>
                          <td className="tl-status tl-status--met">Met</td>
                        </tr>
                        <tr>
                          <td>01/28/2026</td>
                          <td>CS-1043</td>
                          <td>J. Lim</td>
                          <td>09:00</td>
                          <td>Medium</td>
                          <td>15:00</td>
                          <td>15:30</td>
                          <td>15:45</td>
                          <td className="tl-status tl-status--missed">
                            Not Met
                          </td>
                        </tr>
                        <tr>
                          <td>01/28/2026</td>
                          <td>CS-1044</td>
                          <td>S. Tan</td>
                          <td>09:00</td>
                          <td>Low</td>
                          <td>16:00</td>
                          <td>14:10</td>
                          <td>14:20</td>
                          <td className="tl-status tl-status--met">Met</td>
                        </tr>
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
                      <p className="tl-tile-subtitle">
                        Visualization placeholder
                      </p>
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
                    <p className="tl-tile-subtitle">
                      Workload snapshot by agent
                    </p>
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
                    <p className="tl-tile-subtitle">
                      Create, update, and remove team members
                    </p>
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
                    <p className="tl-tile-subtitle">
                      Team lead can edit or delete users
                    </p>
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
            <div className="tl-upload-box">
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
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default DashboardTeamLead;
