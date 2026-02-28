import { useState, useEffect } from "react";
import "./NotificationCarousel.css";

// notifications: array of help request objects from Firestore (via helpRequestsAPI)
// Each item: { id, agent, caseNumber, reason, time, status, read }
function NotificationCarousel({ isVisible = true, onNotificationClick, notifications = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  // Only show requests the team lead has NOT yet read
  const unreadNotifications = notifications.filter((n) => !n.read);

  // Keep currentIndex in bounds if unread list shrinks
  useEffect(() => {
    if (unreadNotifications.length > 0 && currentIndex >= unreadNotifications.length) {
      setCurrentIndex(0);
    }
  }, [unreadNotifications.length, currentIndex]);

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % unreadNotifications.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [unreadNotifications.length, resetKey]);

  const handlePrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? unreadNotifications.length - 1 : prev - 1,
    );
    setResetKey((prev) => prev + 1);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % unreadNotifications.length);
    setResetKey((prev) => prev + 1);
  };

  if (unreadNotifications.length === 0 || !isVisible) return null;

  const currentNotification = unreadNotifications[currentIndex];

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
        <span className="notification-badge">{unreadNotifications.length}</span>
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
            {currentNotification.caseNumber}: {currentNotification.reason}
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
          {unreadNotifications.map((_, index) => (
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
