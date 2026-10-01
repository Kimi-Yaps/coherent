import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import logoIcon from '../assets/Logo.svg';
import authIllustration from '../assets/CoherentAuth.webp';
import './Auth.css';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, user, profile } = useAuth();

  // Determine initial tab from query param (e.g., ?mode=signup)
  const searchParams = new URLSearchParams(location.search);
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Target destination after login
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  // If already logged in, redirect safely inside useEffect
  useEffect(() => {
    if (user || profile) {
      navigate(from, { replace: true });
    }
  }, [user, profile, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        if (!email || !password) {
          throw new Error('Please enter both email and password.');
        }
        await signIn(email, password);
      } else {
        if (!email || !password || !name) {
          throw new Error('Please fill in all required fields.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        const userHandle = username || email.split('@')[0];
        await signUp(email, password, name, userHandle, 'patient');
      }

      navigate(from, { replace: true });
    } catch (err: unknown) {
      console.error('[Coherent Auth Error]:', err);
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please try again.';
      // Friendly message replacements for Firebase error codes
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (msg.includes('auth/email-already-in-use')) {
        setError('This email address is already registered. Please sign in instead.');
      } else if (msg.includes('auth/username-already-in-use')) {
        setError('This username is already taken. Please choose a different username.');
      } else if (msg.includes('auth/invalid-email')) {
        setError('Please enter a valid email address (e.g., name@example.com).');
      } else if (msg.includes('auth/weak-password')) {
        setError('Password must be at least 6 characters long.');
      } else if (msg.includes('auth/user-not-found')) {
        setError('No account found with this email. Please create an account.');
      } else if (msg.includes('auth/operation-not-allowed') || msg.includes('auth/configuration-not-found')) {
        setError('Email/Password provider is not enabled in your Firebase Console. Go to Firebase Console ➔ Authentication ➔ Sign-in method ➔ Enable Email/Password.');
      } else if (msg.includes('auth/admin-restricted-operation') || msg.includes('ADMIN_ONLY_OPERATION')) {
        setError('Sign-up is disabled for this project. Go to Firebase Console ➔ Authentication ➔ Settings ➔ User actions ➔ Enable create (sign-up).');
      } else if (msg.includes('auth/too-many-requests')) {
        setError('Access temporarily disabled due to many failed attempts. Please try again later.');
      } else {
        setError(msg.replace(/^Firebase:\s*/, ''));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        {/* Auth form card (Left side) */}
        <div className="auth-card">
          {/* Brand header */}
          <div className="auth-header">
            <Link to="/" className="auth-brand">
              <img src={logoIcon} alt="Coherent" />
              <span>Coherent</span>
            </Link>
            <h1 className="auth-title">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="auth-subtitle">
              {mode === 'signin'
                ? 'Access your private wellbeing companion and counselor chats'
                : 'Join a safe space for mental health care and recovery'}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => {
                setMode('signin');
                setError('');
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setMode('signup');
                setError('');
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="auth-alert error" role="alert">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <div className="auth-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Jordan Miller"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label>Username (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. jordan_m"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="auth-field">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading
                ? 'Please wait...'
                : mode === 'signin'
                ? 'Sign In'
                : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Visual Artwork side (Right side) */}
        <div className="auth-visual-side">
          <div className="auth-visual-card">
            <img 
              src={authIllustration} 
              alt="Coherent" 
              className="auth-visual-image" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
