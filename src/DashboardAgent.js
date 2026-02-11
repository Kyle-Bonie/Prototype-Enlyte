import { useState, useEffect } from "react";
import ApricusLogo from "./assets/ApricusLogo.png";
import "./DashboardAgent.css";

function DashboardAgent({ username, onLogout }) {
  const [activeView, setActiveView] = useState("cases");
  const [showAssignedModal, setShowAssignedModal] = useState(true);
  const [selectedCases, setSelectedCases] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [remainingTime, setRemainingTime] = useState(4 * 60 * 60); // 4 hours in seconds

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
    }, 10000); // 10 seconds delay for all notifications

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

  const handleMarkAsDone = () => {
    alert("Case/s marked as done.");
    setSelectedCases({});
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
                  <button
                    className="tl-assign-button"
                    type="button"
                    disabled={!hasSelectedCases}
                    onClick={handleMarkAsDone}
                  >
                    Mark as Done
                  </button>
                </div>
                <div className="tl-table-wrap">
                  <table className="tl-table">
                    <thead>
                      <tr>
                        <th aria-label="Select" />
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
                      <tr className="tl-row tl-row--met">
                        <td />
                        <td>01/29/2026</td>
                        <td>CS-2041</td>
                        <td>09:00</td>
                        <td>Urgent</td>
                        <td>13:30</td>
                        <td>12:45</td>
                        <td>12:55</td>
                        <td className="tl-status tl-status--met">Met</td>
                      </tr>
                      <tr className="tl-row tl-row--missed">
                        <td>
                          <input
                            type="checkbox"
                            aria-label="Select case CS-2042"
                            checked={!!selectedCases["CS-2042"]}
                            onChange={() => handleCaseToggle("CS-2042")}
                          />
                        </td>
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
