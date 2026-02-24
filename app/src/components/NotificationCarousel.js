import { useState, useEffect } from "react";
import "./NotificationCarousel.css";

function NotificationCarousel({ isVisible = true, onNotificationClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  // Dummy data for help requests from agents
  const notifications = [
    {
      id: 1,
      agent: "A. Cruz",
      caseId: "CS-2041",
      reason: "This is a test notification - Help request submitted",
      time: "5 mins ago",
    },
    {
      id: 2,
      agent: "J. Lim",
      caseId: "CS-2043",
      reason: "Test message - Agent needs assistance",
      time: "12 mins ago",
    },
    {
      id: 3,
      agent: "S. Tan",
      caseId: "CS-2045",
      reason: "Sample help request for testing purposes",
      time: "18 mins ago",
    },
    {
      id: 4,
      agent: "M. Santos",
      caseId: "CS-2047",
      reason: "Test notification - Support needed",
      time: "25 mins ago",
    },
  ];

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % notifications.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [notifications.length, resetKey]);

  const handlePrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? notifications.length - 1 : prev - 1,
    );
    setResetKey((prev) => prev + 1);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % notifications.length);
    setResetKey((prev) => prev + 1);
  };

  if (notifications.length === 0 || !isVisible) return null;

  const currentNotification = notifications[currentIndex];

  const handlePanelClick = () => {
    if (onNotificationClick) {
      onNotificationClick();
    }
  };

  return (
    <div
      className="notification-carousel"
      onClick={handlePanelClick}
      style={{ cursor: "pointer" }}
    >
      <div className="notification-icon">
        <span className="notification-bell">🔔</span>
        <span className="notification-badge">{notifications.length}</span>
      </div>

      <div className="notification-content">
        <div key={currentIndex} className="notification-slide">
          <div className="notification-header">
            <span className="notification-label">Help Request</span>
            <span className="notification-time">
              {currentNotification.time}
            </span>
          </div>
          <div className="notification-message">
            <strong>{currentNotification.agent}</strong> -{" "}
            {currentNotification.caseId}: {currentNotification.reason}
          </div>
        </div>
      </div>

      <div className="notification-controls">
        <button
          className="notification-nav-btn"
          onClick={(e) => {
            e.stopPropagation();
            handlePrevious();
          }}
          aria-label="Previous notification"
        >
          ‹
        </button>
        <div className="notification-indicators">
          {notifications.map((_, index) => (
            <span
              key={index}
              className={`notification-dot ${index === currentIndex ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
            />
          ))}
        </div>
        <button
          className="notification-nav-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          aria-label="Next notification"
        >
          ›
        </button>
      </div>
    </div>
  );
}

export default NotificationCarousel;
