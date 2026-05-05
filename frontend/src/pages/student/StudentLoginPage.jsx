/**
 * Student Login Page.
 * Authenticates via Fingerprint ID and OTP.
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function StudentLoginPage() {
  const [fingerprintId, setFingerprintId] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { studentLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fingerprintId || !otp) {
      setError('Please provide both Fingerprint ID and OTP.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      await studentLogin(fingerprintId, otp);
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
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
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-container">
        <div className="auth-card slide-up">
          <div className="auth-header">
            <div className="auth-logo" style={{ background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)', color: '#2E7D32' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h1>Student Portal</h1>
            <p>Verify your identity to access your dashboard</p>
          </div>

          <div className="auth-body">
            {error && (
              <div style={{
                padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '10px', color: '#dc2626', fontSize: '0.88rem',
                marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '8px', fontWeight: 500
              }}>
                {error}
              </div>
            )}

            {/* Note on test credentials */}
            <div style={{
              padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: '10px', color: '#16a34a', fontSize: '0.85rem', marginBottom: '24px', fontWeight: 500
            }}>
              <strong>Test Credentials:</strong> Use Fingerprint ID <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>999</code> and OTP <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>482391</code>.
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="fingerprint-id">Fingerprint ID</label>
                <input
                  id="fingerprint-id"
                  type="number"
                  className="form-input"
                  placeholder="Enter your ID number"
                  value={fingerprintId}
                  onChange={e => setFingerprintId(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="otp-code">OTP Code</label>
                <input
                  id="otp-code"
                  type="text"
                  className="form-input"
                  style={{ letterSpacing: '2px', fontFamily: 'monospace' }}
                  placeholder="000 000"
                  maxLength="6"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '16px' }}>
                {loading ? 'Verifying...' : 'Verify & Enter'}
              </button>
            </form>

            <div className="auth-divider">or</div>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <p style={{ color: '#7c8494', fontSize: '0.9rem', margin: 0 }}>
                Are you a lecturer?
              </p>
              <Link to="/auth/login" className="btn btn-ghost btn-sm" style={{ color: '#4a5568', marginTop: '8px' }}>
                Log in as Lecturer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
