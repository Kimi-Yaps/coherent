import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './AdminPortal.css';

const DEFAULT_ADMIN_KEY = 'COHERENT-CLINICAL-2026';

const AdminPortal = () => {
  const navigate = useNavigate();
  const { loginAsDemo, signIn } = useAuth();
  const [accessKey, setAccessKey] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [useEmailAuth, setUseEmailAuth] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 860;

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (accessKey.trim() === DEFAULT_ADMIN_KEY || accessKey.trim().toLowerCase() === 'admin2026') {
      loginAsDemo('admin');
      navigate('/admin', { replace: true });
    } else {
      setError('Invalid admin access key. Please check your credentials or use the demo pass.');
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(adminEmail, adminPassword);
      navigate('/admin', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="admin-portal-container">
      <div className="admin-portal-card">

        <h1 className="admin-portal-title">Admin Portal</h1>
        <p className="admin-portal-subtitle">
          Secure admin access to patient conversations, care activity, and support tools.
        </p>

        {isMobile && (
          <div className="admin-portal-error" style={{ marginBottom: '1.25rem' }}>
            <span>💻 Note: The full Admin dashboard requires a desktop/laptop computer view.</span>
          </div>
        )}

        {error && (
          <div className="admin-portal-error" role="alert" style={{ marginBottom: '1.25rem' }}>
            <span>⚠️ {error}</span>
          </div>
        )}

        {!useEmailAuth ? (
          <form className="admin-portal-form" onSubmit={handleKeySubmit}>
            <div className="admin-portal-field">
              <label>Admin Access Key</label>
              <input
                type="password"
                placeholder="Enter admin access key"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="admin-portal-btn">
              Sign In as Admin
            </button>
          </form>
        ) : (
          <form className="admin-portal-form" onSubmit={handleEmailSubmit}>
            <div className="admin-portal-field">
              <label>Admin Email</label>
              <input
                type="email"
                placeholder="admin@coherent.care"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
              />
            </div>

            <div className="admin-portal-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="admin-portal-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In as Admin'}
            </button>
          </form>
        )}


        <div className="admin-portal-footer">
          <p>
            {useEmailAuth ? (
              <button
                type="button"
                onClick={() => setUseEmailAuth(false)}
                style={{ color: '#9cd490', textDecoration: 'underline' }}
              >
                Use Admin Access Key instead
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setUseEmailAuth(true)}
                style={{ color: '#9cd490', textDecoration: 'underline' }}
              >
                Sign in with Admin Email / Password
              </button>
            )}
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            Return to <Link to="/">Patient Portal</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
