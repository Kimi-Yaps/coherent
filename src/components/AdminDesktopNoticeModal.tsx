import React from 'react';

interface AdminDesktopNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDesktopNoticeModal: React.FC<AdminDesktopNoticeModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="desktop-notice-overlay" onClick={onClose}>
      <div className="desktop-notice-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="desktop-notice-close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>
        <div className="desktop-notice-icon-box">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>
        <h3 className="desktop-notice-title">Access Through Computer</h3>
        <p className="desktop-notice-desc">
          The Admin & Clinical Relapse Management portal is designed exclusively for computer screens to review transcripts, clinical analytics, and risk factors safely.
        </p>
        <div className="desktop-notice-highlight">
          <span>💻</span> Please log in to your account from a desktop or laptop computer.
        </div>
        <button
          type="button"
          className="desktop-notice-btn"
          onClick={onClose}
        >
          Understood
        </button>
      </div>
    </div>
  );
};
