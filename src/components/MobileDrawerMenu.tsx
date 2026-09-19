import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { UserProfile } from '../context/useAuth';
import logoIcon from '../assets/Logo.svg';
import profileIcon from '../assets/Profile.svg';

interface MobileDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onAdminClick: () => void;
  profile: UserProfile | null;
}

interface NavItemConfig {
  name: string;
  path: string;
  icon: string;
  description: string;
  badge?: string;
  adminOnly?: boolean;
  isActive: (pathname: string) => boolean;
}

const navItems: NavItemConfig[] = [
  {
    name: 'Home',
    path: '/',
    icon: '🏠',
    description: 'Daily overview & check-in',
    isActive: (pathname) => pathname === '/',
  },
  {
    name: 'AI Support',
    path: '/ai-support',
    icon: '🌱',
    description: 'Conversational companion & care',
    badge: '24/7',
    isActive: (pathname) => pathname.startsWith('/ai-support'),
  },
  {
    name: 'Bookings',
    path: '/bookings',
    icon: '🗓️',
    description: 'Upcoming sessions & calendar',
    isActive: (pathname) =>
      pathname.startsWith('/bookings') ||
      pathname.startsWith('/reschedule') ||
      pathname.startsWith('/calendar'),
  },
  {
    name: 'FAQ',
    path: '/faq',
    icon: '❔',
    description: 'Help center & common answers',
    isActive: (pathname) => pathname.startsWith('/faq'),
  },
  {
    name: 'Admin',
    path: '/admin',
    icon: '⚙️',
    description: 'Management & platform dashboard',
    adminOnly: true,
    isActive: (pathname) => pathname.startsWith('/admin') || pathname.startsWith('/clinical-calendar'),
  },
];

export const MobileDrawerMenu: React.FC<MobileDrawerMenuProps> = ({
  isOpen,
  onClose,
  isAdmin,
  onAdminClick,
  profile,
}) => {
  const location = useLocation();

  return (
    <div
      className={`mobile-fullscreen-menu ${isOpen ? 'open' : ''}`}
      aria-hidden={!isOpen}
    >
      {/* Fullscreen Menu Top Bar */}
      <div className="mobile-fullscreen-header">
        <Link to="/" className="navbar-logo" onClick={onClose}>
          <img src={logoIcon} alt="Coherent" className="logo-img" />
          <span className="logo-text">Coherent</span>
        </Link>

        <button
          type="button"
          className="mobile-close-btn"
          onClick={onClose}
          aria-label="Close menu"
        >
          <span className="close-bar close-bar-1" />
          <span className="close-bar close-bar-2" />
        </button>
      </div>

      {/* Fullscreen Menu Content */}
      <div className="mobile-fullscreen-body">
        {/* Navigation links */}
        <div className="mobile-nav-group">
          <span className="mobile-nav-label">Navigation</span>
          <div className="mobile-links-list">
            {navItems
              .filter((item) => !item.adminOnly || isAdmin)
              .map((item) => {
                const active = item.isActive(location.pathname);
                return (
                  <Link
                    key={item.path}
                    to={item.name === 'Admin' ? '#' : item.path}
                    className={`mobile-nav-item ${active ? 'active' : ''}`}
                    onClick={(e) => {
                      if (item.name === 'Admin') {
                        e.preventDefault();
                        onAdminClick();
                      } else {
                        onClose();
                      }
                    }}
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
          {profile ? (
            <Link
              to="/profile"
              className={`mobile-profile-card ${location.pathname.startsWith('/profile') ? 'active' : ''}`}
              onClick={onClose}
            >
              <img src={profileIcon} alt="Profile" className="mobile-profile-avatar" />
              <div className="mobile-profile-info">
                <span className="mobile-profile-name">{profile.displayName || 'My Profile'}</span>
                <span className="mobile-profile-sub">
                  @{profile.username || 'member'} · {profile.role}
                </span>
              </div>
              <span className="mobile-nav-arrow">›</span>
            </Link>
          ) : (
            <Link
              to="/auth"
              className="mobile-profile-card"
              onClick={onClose}
            >
              <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>🔑</span>
              <div className="mobile-profile-info">
                <span className="mobile-profile-name">Sign In / Register</span>
                <span className="mobile-profile-sub">Access your personal care companion</span>
              </div>
              <span className="mobile-nav-arrow">›</span>
            </Link>
          )}
        </div>

        {/* Footer note */}
        <div className="mobile-menu-footer">
          <p className="crisis-note">
            <strong>Need urgent support?</strong> Call or text <strong>988</strong> for free, confidential 24/7 care.
          </p>
        </div>
      </div>
    </div>
  );
};
