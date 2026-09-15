import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import bellIcon from '../assets/frame.svg';
import profileIcon from '../assets/Profile.svg';
import './NavBar.css';
import logoIcon from '../assets/Logo.svg';

interface NotificationItem {
  id: number;
  icon: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  link: string;
}

const initialNotifications: NotificationItem[] = [
  {
    id: 1,
    icon: '🗓️',
    title: 'Upcoming Session',
    description: 'Amelia Chen · 14 Sep at 10:30',
    time: '15m ago',
    read: false,
    link: '/bookings'
  },
  {
    id: 2,
    icon: '💬',
    title: 'Message from Iman Hakimi',
    description: 'Hey there! How has your day been...',
    time: '45m ago',
    read: false,
    link: '/chats'
  },
  {
    id: 3,
    icon: '🌱',
    title: 'Gentle Reminder',
    description: 'Take three deep breaths. You are doing fine.',
    time: '2h ago',
    read: false,
    link: '/ai-support'
  }
];

const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (item: NotificationItem) => {
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
    setShowNotifications(false);
    navigate(item.link);
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <img src={logoIcon} alt="Coherent" className="logo-img" />
        <span className="logo-text">Coherent</span>
      </Link>

      <div className="navbar-links">
        <Link 
          to="/ai-support" 
          className={`nav-link ${location.pathname.startsWith('/ai-support') ? 'active' : ''}`}
        >
          AI Support
        </Link>
        <Link 
          to="/chats" 
          className={`nav-link ${location.pathname.startsWith('/chats') ? 'active' : ''}`}
        >
          Chats
        </Link>
        <Link 
          to="/bookings" 
          className={`nav-link ${location.pathname.startsWith('/bookings') || location.pathname.startsWith('/reschedule') || location.pathname.startsWith('/calendar') ? 'active' : ''}`}
        >
          Bookings
        </Link>
      </div>
      
      <div className="navbar-actions" ref={dropdownRef}>
        <div className="notification-wrapper">
          <button 
            className="icon-btn bell-btn" 
            title="Notifications"
            onClick={() => setShowNotifications(prev => !prev)}
            aria-expanded={showNotifications}
          >
            <img src={bellIcon} alt="Notifications" />
            {unreadCount > 0 && <span className="notification-dot" />}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <div className="notification-header-title">
                  <span>Notifications</span>
                  {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
                </div>
                {unreadCount > 0 && (
                  <button className="mark-read-btn" onClick={markAllAsRead}>
                    Mark all as read
                  </button>
                )}
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
                      onClick={() => handleNotificationClick(item)}
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
                      {!item.read && <span className="notif-item-dot" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <Link to="/profile" className="icon-btn profile-btn" title="Profile">
          <img src={profileIcon} alt="Profile" />
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;
