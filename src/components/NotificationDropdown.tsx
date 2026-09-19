import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, type AppNotification } from '../context/useNotifications';

interface NotificationDropdownProps {
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  } = useNotifications();

  const handleNotificationClick = (item: AppNotification) => {
    markAsRead(item.id);
    onClose();
    navigate(item.link);
  };

  return (
    <div className="notification-dropdown">
      <div className="notification-header">
        <div className="notification-header-title">
          <span>Notifications</span>
          {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
        </div>
        <div className="notification-header-actions">
          {unreadCount > 0 && (
            <button
              type="button"
              className="mark-read-btn"
              onClick={markAllAsRead}
              title="Mark all notifications as read"
            >
              Mark all as read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              type="button"
              className="clear-all-btn"
              onClick={clearAllNotifications}
              title="Clear all notifications"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="empty-notifications">
            <p>No notifications right now.</p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`notification-item ${item.read ? 'read' : 'unread'}`}
            >
              <button
                type="button"
                className="notif-main-action"
                onClick={() => handleNotificationClick(item)}
                aria-label={`${item.title}: ${item.description}`}
              >
                <div className="notif-icon-col">
                  <span className="notif-icon">{item.icon}</span>
                </div>
                <div className="notif-content-col">
                  <div className="notif-row">
                    <strong className="notif-title">{item.title}</strong>
                    <span className="notif-time">{item.time}</span>
                  </div>
                  <p className="notif-desc">{item.description}</p>
                </div>
              </button>

              <div className="notif-actions-col">
                {!item.read && <span className="notif-item-dot" />}
                <button
                  type="button"
                  className="notif-dismiss-btn"
                  onClick={() => clearNotification(item.id)}
                  title="Dismiss notification"
                  aria-label={`Dismiss notification: ${item.title}`}
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
