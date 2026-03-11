import React, { useState, useEffect, useRef } from "react";
import "./TimeLogger.css";

/**
 * TimeLogger Component
 * Allows agents to track time spent on cases
 * @param {Array} cases - List of cases from Case Table
 * @param {Function} onLogTime - Callback when time is logged (receives caseId and seconds)
 */
function TimeLogger({ cases, onLogTime }) {
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef(null);

  // Format seconds to HH:MM:SS
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  // Start timer
  const handleStart = () => {
    if (!selectedCaseId) {
      alert("Please select a case first");
      return;
    }
    setIsRunning(true);
  };

  // Stop/Pause timer
  const handleStop = () => {
    setIsRunning(false);
  };

  // Finish and log time
  const handleFinish = () => {
    if (elapsedSeconds === 0) {
      alert("No time to log");
      return;
    }
    if (!selectedCaseId) {
      alert("Please select a case");
      return;
    }

    // Call the callback with case ID and elapsed time
    onLogTime(selectedCaseId, elapsedSeconds);

    // Reset the timer
    setElapsedSeconds(0);
    setIsRunning(false);
    setSelectedCaseId("");
  };

  // Timer effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Reset when case selection changes
  const handleCaseChange = (e) => {
    if (isRunning) {
      const confirm = window.confirm(
        "Changing case will reset the timer. Continue?"
      );
      if (!confirm) return;
      setIsRunning(false);
      setElapsedSeconds(0);
    }
    setSelectedCaseId(e.target.value);
  };

  return (
    <div className="time-logger-widget">
      <div className="time-logger-widget-header">
        <span className="time-logger-widget-icon">⏱️</span>
        <h4 className="time-logger-widget-title">Time Logger</h4>
        {isRunning && <span className="widget-status-badge">● Active</span>}
      </div>
      <div className="time-logger-widget-body">
        <select
          className="time-logger-widget-select"
          value={selectedCaseId}
          onChange={handleCaseChange}
          disabled={isRunning}
        >
          <option value="">Select case...</option>
          {cases.map((caseItem) => (
            <option key={caseItem.firestoreId} value={caseItem.firestoreId}>
              {caseItem._raw?.["Case Number"] || caseItem.id || "Unknown"}
            </option>
          ))}
        </select>

        <div className="time-logger-widget-timer">
          {formatTime(elapsedSeconds)}
        </div>

        <div className="time-logger-widget-controls">
          <button
            className="widget-btn widget-btn-start"
            onClick={handleStart}
            disabled={isRunning || !selectedCaseId}
            title="Start Timer"
          >
            ▶
          </button>
          <button
            className="widget-btn widget-btn-stop"
            onClick={handleStop}
            disabled={!isRunning}
            title="Stop Timer"
          >
            ⏸
          </button>
          <button
            className="widget-btn widget-btn-finish"
            onClick={handleFinish}
            disabled={elapsedSeconds === 0}
            title="Finish & Log"
          >
            ✓
          </button>
        </div>
      </div>
    </div>
  );
}

export default TimeLogger;
