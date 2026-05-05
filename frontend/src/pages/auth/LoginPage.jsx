/**
 * Login page with split-panel design.
 * Left panel: decorative branding. Right panel: login form.
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login(email, password);
      if (userData.is_admin) {
        navigate('/admin-portal');
      } else if (userData.is_lecturer) {
        navigate('/lecturer/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotSuccess('');
    try {
      const api = (await import('../../api/axios')).default;
      await api.post('/auth/forgot-password/', { email: forgotEmail });
      setForgotSuccess('If an account with that email exists, a password reset link has been sent.');
    } catch {
      setForgotSuccess('If an account with that email exists, a password reset link has been sent.');
    }
  };

  return (
    <div className="auth-page">
      {/* Left decorative panel */}
      <div className="auth-page-decoration">
        <div className="auth-decoration-content">
          <div className="auth-decoration-logo">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" />
              <path d="M5 19.5C5.5 18 6 15 6 12c0-3.5 2.5-6 6-6 3 0 5.5 2 6 5" />
              <path d="M12 12v8c0 2 1 3 2 4" />
              <path d="M8 15c0 2.5.5 5 1 7" />
            </svg>
          </div>
          <h2>AttendTrack</h2>
          <p>Automated class attendance powered by fingerprint and TOTP verification</p>

          <div className="auth-decoration-features">
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" />
                  <path d="M5 19.5C5.5 18 6 15 6 12c0-3.5 2.5-6 6-6" />
                </svg>
              </div>
              Fingerprint-based verification
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              Secure time-based OTP codes
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              Real-time analytics and reports
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              Multi-role access management
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-container">
        <div className="auth-card slide-up">
          {!showForgot ? (
            <>
              <div className="auth-header">
                <div className="auth-logo">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" />
                    <path d="M5 19.5C5.5 18 6 15 6 12c0-3.5 2.5-6 6-6 3 0 5.5 2 6 5" />
                    <path d="M12 12v8c0 2 1 3 2 4" />
                    <path d="M8 15c0 2.5.5 5 1 7" />
                  </svg>
                </div>
                <h1>Welcome back</h1>
                <p>Sign in to your lecturer or admin account</p>
              </div>

              <div className="auth-body">
                <form onSubmit={handleLogin}>
                  {error && (
                    <div style={{
                      padding: '12px 16px',
                      background: '#fef2f2',
                      color: '#dc2626',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      marginBottom: '18px',
                      fontWeight: 500,
                      border: '1px solid #fecaca',
                    }}>
                      {error}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="login-email">Email Address</label>
                    <input
                      id="login-email"
                      type="email"
                      className="form-input"
                      placeholder="you@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="login-password">Password</label>
                    <input
                      id="login-password"
                      type="password"
                      className="form-input"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setShowForgot(true)}
                      style={{ padding: '4px 0', fontSize: '0.82rem', color: '#7c8494' }}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>

                <div className="auth-divider">or</div>

                <Link to="/auth/signup" className="btn btn-secondary btn-full">
                  Create an Account
                </Link>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                  <Link to="/student/login" className="btn btn-ghost btn-sm" style={{ color: '#7c8494' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" />
                      <path d="M5 19.5C5.5 18 6 15 6 12c0-3.5 2.5-6 6-6 3 0 5.5 2 6 5" />
                    </svg>
                    Student Portal
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="auth-header">
                <div className="auth-logo">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h1>Reset Password</h1>
                <p>Enter your email and we will send you a reset link</p>
              </div>

              <div className="auth-body">
                <form onSubmit={handleForgotPassword}>
                  {forgotSuccess && (
                    <div style={{
                      padding: '12px 16px',
                      background: '#f0fdf4',
                      color: '#16a34a',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      marginBottom: '18px',
                      fontWeight: 500,
                      border: '1px solid #bbf7d0',
                    }}>
                      {forgotSuccess}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="forgot-email">Email Address</label>
                    <input
                      id="forgot-email"
                      type="email"
                      className="form-input"
                      placeholder="you@university.edu"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-full" style={{ marginBottom: '10px' }}>
                    Send Reset Link
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-full"
                    onClick={() => { setShowForgot(false); setForgotSuccess(''); }}
                  >
                    Back to Sign In
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
