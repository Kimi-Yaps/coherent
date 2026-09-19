import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useNotifications } from '../context/useNotifications';
import { NotificationDropdown } from './NotificationDropdown';
import { MobileDrawerMenu } from './MobileDrawerMenu';
import { AdminDesktopNoticeModal } from './AdminDesktopNoticeModal';
import bellIcon from '../assets/frame.svg';
import profileIcon from '../assets/Profile.svg';
import logoIcon from '../assets/Logo.svg';
import './NavBar.css';

const NavBar = () => {
  const location = useLocation();
  const { role, profile } = useAuth();
  const { unreadCount } = useNotifications();
  const isAdmin = role === 'clinician_admin';

  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAdminDesktopNotice, setShowAdminDesktopNotice] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-close menu and notification dropdown on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowNotifications(false);
    setShowAdminDesktopNotice(false);
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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
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
            to="/bookings"
            className={`nav-link ${
              location.pathname.startsWith('/bookings') ||
              location.pathname.startsWith('/reschedule') ||
              location.pathname.startsWith('/calendar')
                ? 'active'
                : ''
            }`}
          >
            Bookings
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className={`nav-link ${location.pathname.startsWith('/admin') || location.pathname.startsWith('/clinical-calendar') || location.pathname.startsWith('/patient-detail') ? 'active' : ''}`}
              onClick={(e) => {
                if (window.innerWidth <= 860) {
                  e.preventDefault();
                  setShowAdminDesktopNotice(true);
                }
              }}
            >
              Admin
            </Link>
          )}
        </div>

        <div className="navbar-actions" ref={dropdownRef}>
          <div className="notification-wrapper">
            <button
              type="button"
              className="icon-btn bell-btn"
              title="Notifications"
              onClick={() => {
                setShowNotifications((prev) => !prev);
                if (isMobileMenuOpen) setIsMobileMenuOpen(false);
              }}
              aria-expanded={showNotifications}
            >
              <img src={bellIcon} alt="Notifications" />
              {unreadCount > 0 && <span className="notification-dot" />}
            </button>

            {showNotifications && (
              <NotificationDropdown onClose={() => setShowNotifications(false)} />
            )}
          </div>

          {/* Desktop profile or sign in button */}
          {profile ? (
            <Link to="/profile" className="icon-btn profile-btn" title="Profile">
              <img src={profileIcon} alt="Profile" />
            </Link>
          ) : (
            <Link to="/auth" className="nav-signin-btn" title="Sign In">
              Sign In
            </Link>
          )}

          {/* Mobile burger toggle button */}
          <button
            type="button"
            className={`burger-btn ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            <span className="burger-line line-1" />
            <span className="burger-line line-2" />
            <span className="burger-line line-3" />
          </button>
        </div>
      </nav>

      {/* Fullscreen Mobile Drawer Menu */}
      <MobileDrawerMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isAdmin={isAdmin}
        onAdminClick={() => setShowAdminDesktopNotice(true)}
        profile={profile}
      />

      {/* Desktop Access Required Notice Modal */}
      <AdminDesktopNoticeModal
        isOpen={showAdminDesktopNotice}
        onClose={() => setShowAdminDesktopNotice(false)}
      />
    </>
  );
};

export default NavBar;
