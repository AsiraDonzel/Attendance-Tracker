/**
 * Student Attendance Page (Public - no auth required).
 * Split-panel layout with fingerprint-themed decoration.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Footer from '../../components/Footer';

export default function AttendancePage() {
  const [fingerprintId, setFingerprintId] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [multipleSessions, setMultipleSessions] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

  const handleMark = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    setMultipleSessions(null);
    setLoading(true);

    try {
      const payload = {
        fingerprint_id: parseInt(fingerprintId, 10),
        otp: otp,
      };
      if (selectedSession) {
        payload.session_id = selectedSession;
      }

      const res = await api.post('/attendance/mark/', payload);

      if (res.data.multiple_sessions) {
        setMultipleSessions(res.data.sessions);
      } else {
        setSuccess(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark attendance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionSelect = async (sessionId) => {
    setSelectedSession(sessionId);
    setMultipleSessions(null);
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/attendance/mark/', {
        fingerprint_id: parseInt(fingerprintId, 10),
        otp: otp,
        session_id: sessionId,
      });
      setSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark attendance.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-page-decoration">
          <div className="auth-decoration-content">
            <div className="auth-decoration-logo">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2>You're All Set</h2>
            <p>Your attendance has been recorded successfully for this class session</p>
          </div>
        </div>
        <div className="auth-container">
          <div className="auth-card slide-up" style={{ textAlign: 'center' }}>
            <div className="success-icon" style={{ marginTop: '8px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ marginBottom: '6px', color: '#1a1a2e' }}>Attendance Recorded</h2>
            <p style={{ color: '#7c8494', margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 600 }}>
              {success.course}
            </p>
            <p style={{ color: '#a0aec0', fontSize: '0.85rem', marginBottom: '28px' }}>
              {success.course_title} -- {success.date}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/student/history" className="btn btn-primary btn-full" style={{
                borderRadius: '10px', padding: '13px', background: 'linear-gradient(135deg, #2E7D32, #388e3c)',
                boxShadow: '0 2px 8px rgba(46,125,50,0.25)', fontWeight: 700,
              }}>
                View My Attendance History
              </Link>
              <button className="btn btn-secondary btn-full" onClick={() => {
                setSuccess(null); setFingerprintId(''); setOtp(''); setSelectedSession(null);
              }} style={{ borderRadius: '10px', padding: '13px', border: '1.5px solid #e2e8f0' }}>
                Mark Another Attendance
              </button>
              <Link to="/auth/login" className="btn btn-ghost btn-sm" style={{ color: '#7c8494', marginTop: '4px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* Left decorative panel — fingerprint theme */}
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
          <h2>Mark Attendance</h2>
          <p>Verify your identity using your fingerprint ID and the OTP code from the device</p>

          <div className="auth-decoration-features">
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              </div>
              Step 1: Scan fingerprint on device
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              Step 2: Note your OTP code shown
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              Step 3: Enter both values here
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-container">
        <div className="auth-card slide-up">
          <div className="auth-header">
            <div className="auth-logo">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" />
                <path d="M5 19.5C5.5 18 6 15 6 12c0-3.5 2.5-6 6-6 3 0 5.5 2 6 5" />
                <path d="M12 12v8c0 2 1 3 2 4" />
                <path d="M8 15c0 2.5.5 5 1 7" />
              </svg>
            </div>
            <h1>Student Attendance</h1>
            <p>Enter your credentials from the Arduino device</p>
          </div>

          <div className="auth-body">
            <form onSubmit={handleMark}>
              {error && (
                <div style={{
                  padding: '12px 16px', background: '#fef2f2', color: '#dc2626',
                  borderRadius: '10px', fontSize: '0.85rem', marginBottom: '18px',
                  fontWeight: 500, border: '1px solid #fecaca',
                }}>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="fp-id">Fingerprint ID</label>
                <input
                  id="fp-id"
                  type="number"
                  className="form-input"
                  placeholder="e.g. 999"
                  value={fingerprintId}
                  onChange={(e) => setFingerprintId(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="otp-code">OTP Code (6 digits)</label>
                <input
                  id="otp-code"
                  type="text"
                  className="form-input"
                  placeholder="e.g. 482391"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  style={{ letterSpacing: '6px', fontSize: '1.25rem', textAlign: 'center', fontWeight: 700 }}
                />
              </div>

              {multipleSessions && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ marginBottom: '8px', fontWeight: 600, fontSize: '0.88rem', color: '#4a5568' }}>
                    Multiple active classes found. Select one:
                  </p>
                  {multipleSessions.map(session => (
                    <button key={session.id} type="button" className="btn btn-secondary btn-full"
                      style={{ marginBottom: '8px', justifyContent: 'flex-start', textAlign: 'left', borderRadius: '10px', padding: '14px 16px' }}
                      onClick={() => handleSessionSelect(session.id)}>
                      <div>
                        <strong>{session.course_code}</strong> - {session.course_title}
                        <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>
                          {session.start_time} - {session.end_time}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-full" disabled={loading || !fingerprintId || otp.length !== 6}
                style={{ borderRadius: '10px', padding: '13px', fontSize: '0.95rem', fontWeight: 700,
                  background: 'linear-gradient(135deg, #2E7D32, #388e3c)', boxShadow: '0 2px 8px rgba(46,125,50,0.25)' }}>
                {loading ? 'Verifying...' : 'Mark Attendance'}
              </button>
            </form>

            <div style={{ marginTop: '22px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/student/history" className="btn btn-ghost btn-sm" style={{ color: '#7c8494' }}>
                View Attendance History
              </Link>
              <Link to="/auth/login" className="btn btn-ghost btn-sm" style={{ color: '#7c8494' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Lecturer / Admin Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
