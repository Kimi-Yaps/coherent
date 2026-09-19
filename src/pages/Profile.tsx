import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import { useAuth } from '../context/useAuth';
import { useNotifications } from '../context/useNotifications';
import {
  getGeminiApiKey,
  setGeminiApiKey,
  testGeminiApiKey,
  getGeminiModel,
  DEFAULT_GEMINI_MODEL,
  hasEnvGeminiApiKey,
} from '../services/geminiService';
import { createAdminInvite } from '../services/authService';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const { profile, signOut, updateProfile } = useAuth();
  const { addNotification } = useNotifications();

  const [name, setName] = useState(profile?.displayName || 'Iman Hakimi');
  const [username, setUsername] = useState(profile?.username || 'ImanHakimi');
  const [email, setEmail] = useState(profile?.email || 'ImanHakimi@gmail.com');
  const [adminEmail, setAdminEmail] = useState(
    profile?.adminEmail || localStorage.getItem('coherent_admin_email') || 'clinical-desk@coherent.care'
  );

  const [geminiKey, setGeminiKey] = useState(() => getGeminiApiKey());
  const [showKey, setShowKey] = useState(false);
  const [keyTesting, setKeyTesting] = useState(false);
  const [keyStatus, setKeyStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [saved, setSaved] = useState(false);

  // Invite Admin State
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setInviteFeedback({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    setIsInviting(true);
    setInviteFeedback(null);
    try {
      const res = await createAdminInvite(inviteEmail.trim(), email || 'admin@coherent.care');
      setInviteFeedback({ type: 'success', message: res.message });
      setInviteEmail('');
      addNotification({
        icon: '✉️',
        title: 'Invite Sent',
        description: `Admin invite created for ${inviteEmail.trim()}.`,
        link: '/profile',
        category: 'system',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send invite.';
      setInviteFeedback({ type: 'error', message: msg });
    } finally {
      setIsInviting(false);
    }
  };

  useEffect(() => {
    if (profile) {
      setName(profile.displayName || '');
      setUsername(profile.username || '');
      setEmail(profile.email || '');
      if (profile.adminEmail) {
        setAdminEmail(profile.adminEmail);
      }
      if (profile.geminiApiKey !== undefined) {
        setGeminiKey(profile.geminiApiKey);
        setGeminiApiKey(profile.geminiApiKey);
      }
    }
  }, [profile]);

  const handleTestKey = async () => {
    if (!geminiKey.trim()) {
      setKeyStatus({
        type: 'success',
        message: 'API key is optional. When blank, the companion uses built-in care mode.',
      });
      return;
    }
    setKeyTesting(true);
    setKeyStatus(null);
    const result = await testGeminiApiKey(geminiKey, getGeminiModel() || DEFAULT_GEMINI_MODEL);
    setKeyTesting(false);
    if (result.success) {
      setKeyStatus({ type: 'success', message: result.message });
      setGeminiApiKey(geminiKey);
    } else {
      setKeyStatus({ type: 'error', message: result.message });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    await updateProfile({
      displayName: name,
      username,
      email,
      adminEmail,
      geminiApiKey: geminiKey.trim(),
    });
    setGeminiApiKey(geminiKey.trim());
    setSaved(true);
    addNotification({
      icon: '✓',
      title: 'Settings Saved',
      description: 'Profile updated.',
      link: '/profile',
      category: 'system',
    });
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const initials = (name.split(' ').map((n) => n[0]).join('') || 'U').slice(0, 2).toUpperCase();

  const sidebarContent = (
    <div className="profile-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', width: '100%' }}>
      <div className="claude-sidebar-section-title" style={{ fontSize: '0.74rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0.2rem 0.65rem 0.4rem' }}>
        Account & Settings
      </div>
      <button className="sidebar-nav-btn active">
        <span className="sidebar-nav-bullet" />
        Profile Settings
      </button>
    </div>
  );

  return (
    <SidebarLayout sidebarContent={sidebarContent} className="profile-layout">
      <div className="profile-container">
        <div className="profile-top-bar">
          <h1 className="display-header profile-page-header">Profile Settings</h1>
        </div>

        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">{initials}</div>
            <div className="profile-info">
              <h2>{name}</h2>
              <div className="username-tag">
                <span>@{username}</span>
                {profile?.role === 'clinician_admin' && (
                  <span className="profile-role-badge admin">Administrator</span>
                )}
              </div>
            </div>
          </div>

          {saved && (
            <div className="profile-feedback-banner success">
              Changes saved.
            </div>
          )}

          <form className="profile-form" onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label htmlFor="profile-display-name">Display Name</label>
              <input
                id="profile-display-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="profile-username">Username</label>
              <input
                id="profile-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="profile-email">Email</label>
              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                required
              />
            </div>

            {/* Gemini API Key Configuration */}
            <div className="gemini-companion-section">
              <div className="gemini-section-header">
                <h3 className="gemini-section-title">Gemini API Key</h3>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="get-free-key-link"
                >
                  Get Free Key ↗
                </a>
              </div>

              {/* API Key Input */}
              <div className="gemini-key-box">
                <label htmlFor="profile-gemini-key" className="gemini-key-label">
                  API Key (Optional)
                </label>
                <div className="gemini-key-input-row">
                  <div className="key-input-container">
                    <input
                      id="profile-gemini-key"
                      type={showKey ? 'text' : 'password'}
                      value={geminiKey}
                      onChange={(e) => {
                        setGeminiKey(e.target.value);
                        setKeyStatus(null);
                      }}
                      placeholder={
                        hasEnvGeminiApiKey()
                          ? 'Using .env key (or paste personal key)'
                          : 'Optional — leave blank for built-in care'
                      }
                      className="form-input key-field"
                      autoComplete="off"
                      spellCheck="false"
                    />
                    <button
                      type="button"
                      className="key-eye-btn"
                      onClick={() => setShowKey(!showKey)}
                      aria-label={showKey ? 'Hide key' : 'Show key'}
                    >
                      {showKey ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="test-connect-btn"
                    onClick={handleTestKey}
                    disabled={keyTesting}
                  >
                    {keyTesting ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>

                {keyStatus && (
                  <div className={`key-status-card ${keyStatus.type}`}>
                    <span className="status-message-text">{keyStatus.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Invite Feature */}
            {(profile?.role === 'clinician_admin' || profile?.role === 'admin') && (
              <div className="gemini-companion-section admin-invite-card">
                <div className="gemini-section-header">
                  <h3 className="gemini-section-title">Invite Admin</h3>
                </div>
                <div className="gemini-key-box">
                  <label htmlFor="invite-admin-email" className="gemini-key-label">
                    Colleague Email Address
                  </label>
                  <div className="gemini-key-input-row">
                    <div className="key-input-container">
                      <input
                        id="invite-admin-email"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => {
                          setInviteEmail(e.target.value);
                          setInviteFeedback(null);
                        }}
                        placeholder="colleague@coherent.care"
                        className="form-input admin-invite-input"
                      />
                    </div>
                    <button
                      type="button"
                      className="test-connect-btn invite-admin-action-btn"
                      onClick={handleSendInvite}
                      disabled={isInviting || !inviteEmail.trim()}
                    >
                      {isInviting ? 'Inviting...' : 'Invite'}
                    </button>
                  </div>
                  {inviteFeedback && (
                    <div className={`invite-feedback-banner ${inviteFeedback.type}`}>
                      {inviteFeedback.message}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="form-actions-row">
              <button type="submit" className="save-btn">
                {saved ? 'Saved' : 'Save Changes'}
              </button>
              <button type="button" className="signout-btn" onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          </form>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default Profile;
