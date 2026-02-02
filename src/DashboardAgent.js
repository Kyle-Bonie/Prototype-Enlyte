import { useState } from "react";
import ApricusLogo from "./assets/ApricusLogo.png";
import "./DashboardAgent.css";

function DashboardAgent({ username, onLogout }) {
  const [activeView, setActiveView] = useState("cases");

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
    </div>
  );
}

export default DashboardAgent;
