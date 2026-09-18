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

interface NavItemConfig {
  name: string;
  path: string;
  icon: string;
  description: string;
  badge?: string;
  isActive: (pathname: string) => boolean;
}

const navItems: NavItemConfig[] = [
  {
    name: 'Home',
    path: '/',
    icon: '🏠',
    description: "Daily overview & check-in",
    isActive: (pathname) => pathname === '/'
  },
  {
    name: 'AI Support',
    path: '/ai-support',
    icon: '🌱',
    description: 'Conversational companion & care',
    badge: '24/7',
    isActive: (pathname) => pathname.startsWith('/ai-support')
  },
  {
    name: 'Chats',
    path: '/chats',
    icon: '💬',
    description: 'Direct messages with your counselors',
    isActive: (pathname) => pathname.startsWith('/chats')
  },
  {
    name: 'Bookings',
    path: '/bookings',
    icon: '🗓️',
    description: 'Upcoming sessions & calendar',
    isActive: (pathname) =>
      pathname.startsWith('/bookings') ||
      pathname.startsWith('/reschedule') ||
      pathname.startsWith('/calendar')
  },
  {
    name: 'FAQ',
    path: '/faq',
    icon: '❔',
    description: 'Help center & common answers',
    isActive: (pathname) => pathname.startsWith('/faq')
  },
  {
    name: 'Admin',
    path: '/admin',
    icon: '⚙️',
    description: 'Management & platform dashboard',
    isActive: (pathname) => pathname.startsWith('/admin')
  }
];

const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Auto-close menu and notification dropdown on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowNotifications(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is full-screen
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isMobileMenuOpen]);

  // Close on click outside & escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
        setIsMobileMenuOpen(false);
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
    setNotifications(prev => prev.map(n => (n.id === item.id ? { ...n, read: true } : n)));
    setShowNotifications(false);
    setIsMobileMenuOpen(false);
    navigate(item.link);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
    setShowNotifications(false);
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="navbar-logo" onClick={() => setIsMobileMenuOpen(false)}>
          <img src={logoIcon} alt="Coherent" className="logo-img" />
          <span className="logo-text">Coherent</span>
        </Link>

        {/* Desktop links */}
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
          <Link 
            to="/admin" 
            className={`nav-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
          >
            Admin
          </Link>
        </div>
        
        <div className="navbar-actions" ref={dropdownRef}>
          <div className="notification-wrapper">
            <button 
              className="icon-btn bell-btn" 
              title="Notifications"
              onClick={() => {
                setShowNotifications(prev => !prev);
                if (isMobileMenuOpen) setIsMobileMenuOpen(false);
              }}
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

          {/* Desktop profile button */}
          <Link to="/profile" className="icon-btn profile-btn" title="Profile">
            <img src={profileIcon} alt="Profile" />
          </Link>

          {/* Mobile burger toggle button */}
          <button
            className={`burger-btn ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            <span className="burger-line line-1" />
            <span className="burger-line line-2" />
            <span className="burger-line line-3" />
          </button>
        </div>
      </nav>

      {/* Fullscreen Mobile Menu (Consumes the entire screen) */}
      <div 
        className={`mobile-fullscreen-menu ${isMobileMenuOpen ? 'open' : ''}`}
        aria-hidden={!isMobileMenuOpen}
      >
        {/* Fullscreen Menu Top Bar */}
        <div className="mobile-fullscreen-header">
          <Link 
            to="/" 
            className="navbar-logo" 
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <img src={logoIcon} alt="Coherent" className="logo-img" />
            <span className="logo-text">Coherent</span>
          </Link>

          <button 
            className="mobile-close-btn" 
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <span className="close-bar close-bar-1" />
            <span className="close-bar close-bar-2" />
          </button>
        </div>

        {/* Fullscreen Menu Content */}
        <div className="mobile-fullscreen-body">
          {/* Welcome status banner */}
          <div className="mobile-menu-status">
            <span className="status-dot" />
            <span className="status-text">Your safe space for mental wellbeing</span>
          </div>

          {/* Navigation links */}
          <div className="mobile-nav-group">
            <span className="mobile-nav-label">Navigation</span>
            <div className="mobile-links-list">
              {navItems.map((item) => {
                const active = item.isActive(location.pathname);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`mobile-nav-item ${active ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="mobile-nav-item-left">
                      <span className="mobile-nav-icon">{item.icon}</span>
                      <div className="mobile-nav-text-col">
                        <div className="mobile-nav-name-row">
                          <span className="mobile-nav-name">{item.name}</span>
                          {item.badge && <span className="mobile-nav-badge">{item.badge}</span>}
                        </div>
                        <span className="mobile-nav-desc">{item.description}</span>
                      </div>
                    </div>
                    <div className="mobile-nav-arrow">
                      <span>›</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User profile card */}
          <div className="mobile-profile-section">
            <span className="mobile-nav-label">Account</span>
            <Link 
              to="/profile" 
              className={`mobile-profile-card ${location.pathname.startsWith('/profile') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <img src={profileIcon} alt="Profile" className="mobile-profile-avatar" />
              <div className="mobile-profile-info">
                <span className="mobile-profile-name">My Profile</span>
                <span className="mobile-profile-sub">Account settings & history</span>
              </div>
              <span className="mobile-nav-arrow">›</span>
            </Link>
          </div>

          {/* Footer note */}
          <div className="mobile-menu-footer">
            <p className="crisis-note">
              <strong>Need urgent support?</strong> Call or text <strong>988</strong> for free, confidential 24/7 care.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default NavBar;
