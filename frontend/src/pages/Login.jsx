import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthVisualPanel from '../components/AuthVisualPanel';
import './AuthShared.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      return setError('Missing authentication credentials.');
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return setError('Invalid enterprise email format.');
    }

    try {
      setLoading(true);
      // Simulate Enterprise API Auth
      await new Promise((res) => setTimeout(res, 1800));
      console.log('Enterprise Login success', { email });
      // navigate('/dashboard');
    } catch {
      setError('Invalid entry credentials. Contact systems admin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">
        {/* ── FORM SIDE (LEFT) ── */}
        <div className="auth-form-side page-enter-left">
          <div className="auth-nav">
            <Link to="/" className="back-btn" aria-label="Portal Home">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="nav-context">
              New to WeTano? <Link to="/signup">Register Portal</Link>
            </div>
          </div>

          <div className="auth-main-content">
            <div className="auth-header">
              <h1 style={{ color: '#fff' }}>Portal Access</h1>
              <p>Enter your credentials to manage your AI fleet.</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="minimal-input-group">
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  type="email"
                  placeholder="Work Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              <div className="minimal-input-group">
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Access Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="status-icon"
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
                <Link to="/forgot-password" style={{ position: 'absolute', right: 0, bottom: '-24px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Forgot password?</Link>
              </div>

              {error && (
                <div style={{ color: '#f87171', fontSize: '0.8125rem', marginBottom: '16px', marginTop: '32px', background: 'rgba(248, 113, 113, 0.05)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(248, 113, 113, 0.1)' }}>{error}</div>
              )}

              <div className="auth-footer" style={{ marginTop: error ? '16px' : '48px' }}>
                <button
                  type="submit"
                  className="auth-submit"
                  disabled={loading || !email || !password}
                  style={{ border: 'none' }}
                >
                  {loading ? (
                    <>
                      <svg className="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>Establish Access (Sign In)</span>
                  )}
                </button>

                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.875rem' }}>or</span>

                <div className="social-links">
                  <button type="button" className="circle-social-btn" title="SSO via Google">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335" />
                    </svg>
                  </button>
                  <button type="button" className="circle-social-btn" title="SSO via GitHub">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* ── VISUAL SIDE (RIGHT) ── */}
        <AuthVisualPanel />
      </div>
    </div>
  );
}
