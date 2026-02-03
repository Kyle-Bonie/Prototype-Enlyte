import { useState } from "react";
import ApricusLogo from "./assets/ApricusLogo.png";
import "./DashboardAgent.css";

function DashboardAgent({ username, onLogout }) {
  const [activeView, setActiveView] = useState("cases");
  const [showAssignedModal, setShowAssignedModal] = useState(true);

  const headingText = activeView === "summary" ? "Summary" : "My Cases";

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
            ) : (
              <section className="tl-tile tl-table-tile">
                <div className="tl-tile-header">
                  <h2 className="tl-tile-title">Case Table</h2>
                </div>
                <div className="tl-table-wrap">
                  <table className="tl-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Case Number</th>
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
                        <td>01/29/2026</td>
                        <td>CS-2041</td>
                        <td>09:00</td>
                        <td>Urgent</td>
                        <td>13:30</td>
                        <td>12:45</td>
                        <td>12:55</td>
                        <td className="tl-status tl-status--met">Met</td>
                      </tr>
                      <tr>
                        <td>01/29/2026</td>
                        <td>CS-2042</td>
                        <td>09:00</td>
                        <td>Standard</td>
                        <td>15:10</td>
                        <td>15:40</td>
                        <td>15:55</td>
                        <td className="tl-status tl-status--missed">Not Met</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
      {showAssignedModal ? (
        <div className="agent-modal" role="dialog" aria-modal="true">
          <div
            className="agent-modal-backdrop"
            onClick={() => setShowAssignedModal(false)}
          />
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
              </div>
              <div className="agent-modal-row">
                <span>02/02/2026</span>
                <span>CS-2101</span>
                <span>09:00</span>
                <span className="agent-modal-status agent-modal-status--missed">
                  Not Met
                </span>
              </div>
            </div>
            <div className="agent-modal-actions">
              <button
                className="agent-modal-button agent-modal-button--primary"
                type="button"
                onClick={() => setShowAssignedModal(false)}
              >
                In Progress
              </button>
              <button
                className="agent-modal-button agent-modal-button--secondary"
                type="button"
                onClick={() => setShowAssignedModal(false)}
              >
                I need Help
              </button>
              <button
                className="agent-modal-button agent-modal-button--ghost"
                type="button"
                onClick={() => setShowAssignedModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default DashboardAgent;
