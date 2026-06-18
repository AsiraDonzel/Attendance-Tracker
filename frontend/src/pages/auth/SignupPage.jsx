/**
 * Signup page with role selection (Student / Lecturer) and multi-step forms.
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { DEPARTMENTS, LEVELS, TITLES } from '../../utils/constants';

export default function SignupPage() {
  const [role, setRole] = useState(null); // null, 'student', 'lecturer'
  const navigate = useNavigate();

  if (!role) {
    return (
      <div className="auth-page">
        {/* Left decorative panel */}
        <div className="auth-page-decoration">
          <div className="auth-decoration-content">
            <div className="auth-decoration-logo">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <h2>Join AttendTrack</h2>
            <p>Create your account to access the automated attendance system</p>

            <div className="auth-decoration-features">
              <div className="feature-item">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" /></svg>
                </div>
                Student attendance portal
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                </div>
                Course and schedule management
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                </div>
                Grade calculation and reports
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
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </div>
              <h1>Create Account</h1>
              <p>Choose your account type to get started</p>
            </div>
            <div className="auth-body">
              <button
                className="btn btn-secondary btn-full btn-lg"
                onClick={() => setRole('student')}
                style={{ marginBottom: '12px', justifyContent: 'flex-start', padding: '16px 20px', borderRadius: '12px' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
                </svg>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700 }}>Sign up as Student</div>
                  <div style={{ fontSize: '0.78rem', color: '#7c8494', fontWeight: 400 }}>
                    Mark attendance using fingerprint and OTP
                  </div>
                </div>
              </button>

              <button
                className="btn btn-secondary btn-full btn-lg"
                onClick={() => setRole('lecturer')}
                style={{ justifyContent: 'flex-start', padding: '16px 20px', borderRadius: '12px' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700 }}>Sign up as Lecturer</div>
                  <div style={{ fontSize: '0.78rem', color: '#7c8494', fontWeight: 400 }}>
                    Manage courses, schedule classes, track attendance
                  </div>
                </div>
              </button>

              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Link to="/auth/login" className="btn btn-ghost" style={{ color: '#7c8494' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Already have an account? Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (role === 'student') return <StudentSignup onBack={() => setRole(null)} />;
  return <LecturerSignup onBack={() => setRole(null)} />;
}


/* --- Student Multi-Step Signup --- */
function StudentSignup({ onBack }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '',
    matric_number: '',
    level: '',
    department: '',
    email: '',
    phone: '',
    fingerprint_id: '',
    totp_secret: '',
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/signup/student/', {
        ...form,
        fingerprint_id: parseInt(form.fingerprint_id, 10),
        totp_secret: form.totp_secret.trim().toUpperCase(),
      });
      setSuccess(true);
    } catch (err) {
      const errors = err.response?.data;
      if (errors) {
        const msg = Object.values(errors).flat().join(' ');
        setError(msg);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card slide-up" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div className="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2>Registration Successful</h2>
            <p className="text-muted" style={{ margin: '12px 0 24px' }}>
              Your student account has been created. You can now mark attendance using your
              Fingerprint ID and OTP code from the Arduino device.
            </p>
            <div className="btn-group" style={{ justifyContent: 'center', flexDirection: 'column' }}>
              <Link to="/student/attendance" className="btn btn-primary">
                Go to Attendance Portal
              </Link>
              <Link to="/auth/login" className="btn btn-secondary">
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
      <div className="auth-container">
        <div className="auth-card slide-up">
          <div className="auth-header">
            <h1>Student Registration</h1>
            <p>Step {step} of 3</p>
          </div>

          <div className="auth-body">
            <div className="steps-indicator">
              <div className={`step-dot ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`} />
              <div className={`step-dot ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`} />
              <div className={`step-dot ${step === 3 ? 'active' : ''}`} />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', background: 'var(--danger-light)', color: 'var(--danger)',
                borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            {step === 1 && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" placeholder="e.g. John Doe" value={form.full_name}
                    onChange={(e) => update('full_name', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Matric Number</label>
                  <input className="form-input" placeholder="e.g. 21/ENG02/001" value={form.matric_number}
                    onChange={(e) => update('matric_number', e.target.value)} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Level</label>
                    <select className="form-select" value={form.level} onChange={(e) => update('level', e.target.value)}>
                      <option value="">Select level</option>
                      {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select className="form-select" value={form.department} onChange={(e) => update('department', e.target.value)}>
                      <option value="">Select department</option>
                      {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                </div>
                <button className="btn btn-primary btn-full" onClick={() => setStep(2)}
                  disabled={!form.full_name || !form.matric_number || !form.level || !form.department}>
                  Next
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-input" type="email" placeholder="student@university.edu" value={form.email}
                    onChange={(e) => update('email', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" type="tel" placeholder="+234-800-000-0000" value={form.phone}
                    onChange={(e) => update('phone', e.target.value)} />
                </div>
                <div className="btn-group">
                  <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setStep(3)}
                    disabled={!form.email}>
                    Next
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                {/* ── Fingerprint ID ── */}
                <div className="form-group">
                  <label className="form-label">Fingerprint ID</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="e.g. 5"
                    value={form.fingerprint_id}
                    onChange={(e) => update('fingerprint_id', e.target.value)}
                    required
                  />
                  <div className="form-hint">
                    The slot number entered on the Arduino keypad during enrolment (1–127).
                    Ask your administrator if unsure.
                  </div>
                </div>

                {/* ── TOTP Secret ── */}
                <div className="form-group">
                  <label className="form-label">
                    TOTP Secret Key
                    <span style={{
                      marginLeft: '8px', fontSize: '0.72rem', fontWeight: 400,
                      padding: '2px 7px', borderRadius: '20px',
                      background: 'var(--primary-light, #e8f4fd)',
                      color: 'var(--primary, #3b82f6)'
                    }}>Optional</span>
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. JBSWY3DPEHPK3PXP"
                    value={form.totp_secret}
                    onChange={(e) => update('totp_secret', e.target.value.toUpperCase())}
                    style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
                  />
                  <div className="form-hint">
                    The Base32 secret printed on the Serial Monitor after fingerprint enrolment
                    (e.g. <code style={{ fontSize: '0.78rem' }}>JBSWY3DPEHPK3PXP</code>).
                    Leave blank if your admin will add it later.
                  </div>
                </div>

                <div className="btn-group">
                  <button className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={handleSubmit}
                    disabled={loading || !form.fingerprint_id}
                  >
                    {loading ? 'Registering...' : 'Complete Registration'}
                  </button>
                </div>
              </>
            )}

            <div style={{ textAlign: 'center', marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button className="btn btn-ghost btn-sm" onClick={onBack}>
                Choose a different account type
              </button>
              <Link to="/auth/login" className="btn btn-ghost btn-sm">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* --- Lecturer Multi-Step Signup --- */
function LecturerSignup({ onBack }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    last_name: '',
    first_name: '',
    department: '',
    levels_taught: [],
    num_courses: 1,
    email: '',
    phone: '',
    office_number: '',
    password: '',
    confirm_password: '',
    selected_courses: [],
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleLevel = (level) => {
    setForm(prev => ({
      ...prev,
      levels_taught: prev.levels_taught.includes(level)
        ? prev.levels_taught.filter(l => l !== level)
        : [...prev.levels_taught, level]
    }));
  };

  const toggleCourse = (courseId) => {
    setForm(prev => ({
      ...prev,
      selected_courses: prev.selected_courses.includes(courseId)
        ? prev.selected_courses.filter(id => id !== courseId)
        : [...prev.selected_courses, courseId]
    }));
  };

  const loadCourses = async () => {
    try {
      // Filter by department and levels_taught
      let allCourses = [];
      for (const level of form.levels_taught) {
        const res = await api.get(`/courses/?department=${form.department}&level=${level}`);
        allCourses = [...allCourses, ...res.data];
      }
      // Deduplicate
      const unique = allCourses.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);
      setCourses(unique);
    } catch (err) {
      setCourses([]);
    }
  };

  const goToStep3 = () => {
    loadCourses();
    setStep(3);
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/signup/lecturer/', form);
      // Store tokens and redirect
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      window.location.href = '/lecturer/dashboard';
    } catch (err) {
      const errors = err.response?.data;
      if (errors) {
        const msg = typeof errors === 'string' ? errors
          : Object.values(errors).flat().join(' ');
        setError(msg);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: step === 3 ? '600px' : '480px' }}>
        <div className="auth-card slide-up">
          <div className="auth-header">
            <h1>Lecturer Registration</h1>
            <p>Step {step} of 3</p>
          </div>

          <div className="auth-body">
            <div className="steps-indicator">
              <div className={`step-dot ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`} />
              <div className={`step-dot ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`} />
              <div className={`step-dot ${step === 3 ? 'active' : ''}`} />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', background: 'var(--danger-light)', color: 'var(--danger)',
                borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            {step === 1 && (
              <>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <select className="form-select" value={form.title} onChange={(e) => update('title', e.target.value)}>
                    <option value="">Select title</option>
                    {TITLES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input className="form-input" placeholder="Last name" value={form.last_name}
                      onChange={(e) => update('last_name', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input className="form-input" placeholder="First name" value={form.first_name}
                      onChange={(e) => update('first_name', e.target.value)} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-select" value={form.department} onChange={(e) => update('department', e.target.value)}>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Levels Taught</label>
                  <div className="checkbox-group">
                    {LEVELS.map(l => (
                      <label key={l.value} className={`checkbox-label ${form.levels_taught.includes(l.value) ? 'checked' : ''}`}>
                        <input type="checkbox" checked={form.levels_taught.includes(l.value)}
                          onChange={() => toggleLevel(l.value)} />
                        {l.value}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Number of Courses</label>
                  <select className="form-select" value={form.num_courses} onChange={(e) => update('num_courses', parseInt(e.target.value, 10))}>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <button className="btn btn-primary btn-full" onClick={() => setStep(2)}
                  disabled={!form.title || !form.last_name || !form.first_name || !form.department || form.levels_taught.length === 0}>
                  Next
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-input" type="email" placeholder="lecturer@university.edu" value={form.email}
                    onChange={(e) => update('email', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Office Phone Number</label>
                  <input className="form-input" type="tel" placeholder="+234-800-000-0000" value={form.phone}
                    onChange={(e) => update('phone', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" placeholder="Min 8 chars, uppercase, lowercase, digit, special" value={form.password}
                    onChange={(e) => update('password', e.target.value)} required />
                  <div className="form-hint">
                    At least 8 characters with uppercase, lowercase, digit, and special character.
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input className="form-input" type="password" placeholder="Re-enter password" value={form.confirm_password}
                    onChange={(e) => update('confirm_password', e.target.value)} required />
                  {form.confirm_password && form.password !== form.confirm_password && (
                    <div className="form-error">Passwords do not match.</div>
                  )}
                </div>
                <div className="btn-group">
                  <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={goToStep3}
                    disabled={!form.email || !form.password || form.password !== form.confirm_password || form.password.length < 8}>
                    Next
                  </button>
                </div>
              </>
            )}

            {step === 3 && (() => {
              // Group courses by level, preserving 100L→500L order
              const LEVEL_ORDER = ['100L','200L','300L','400L','500L'];
              const LEVEL_COLORS = {
                '100L': { bg: '#eff6ff', border: '#3b82f6', badge: '#2563eb', text: '#1d4ed8' },
                '200L': { bg: '#f0fdf4', border: '#22c55e', badge: '#16a34a', text: '#15803d' },
                '300L': { bg: '#fff7ed', border: '#f97316', badge: '#ea580c', text: '#c2410c' },
                '400L': { bg: '#faf5ff', border: '#a855f7', badge: '#9333ea', text: '#7e22ce' },
                '500L': { bg: '#fff1f2', border: '#f43f5e', badge: '#e11d48', text: '#be123c' },
              };
              const grouped = {};
              for (const c of courses) {
                if (!grouped[c.level]) grouped[c.level] = [];
                grouped[c.level].push(c);
              }
              const presentLevels = LEVEL_ORDER.filter(l => grouped[l]);

              const toggleAll = (level) => {
                const ids = grouped[level].map(c => c.id);
                const allSelected = ids.every(id => form.selected_courses.includes(id));
                setForm(prev => ({
                  ...prev,
                  selected_courses: allSelected
                    ? prev.selected_courses.filter(id => !ids.includes(id))
                    : [...new Set([...prev.selected_courses, ...ids])]
                }));
              };

              return (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700 }}>Select Courses</h3>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Courses are filtered by your department and selected levels.
                      Click a level header to select/deselect all courses in that level.
                    </p>
                  </div>

                  {courses.length === 0 ? (
                    <div className="empty-state" style={{ padding: '32px', textAlign: 'center' }}>
                      <p style={{ color: 'var(--text-muted)' }}>
                        No courses found for your department and levels.<br />
                        Courses can be added by the admin.
                      </p>
                    </div>
                  ) : (
                    <div style={{ maxHeight: '380px', overflowY: 'auto', marginBottom: '16px', paddingRight: '2px' }}>
                      {presentLevels.map(level => {
                        const col = LEVEL_COLORS[level];
                        const levelCourses = grouped[level];
                        const allSelected = levelCourses.every(c => form.selected_courses.includes(c.id));
                        const someSelected = levelCourses.some(c => form.selected_courses.includes(c.id));

                        return (
                          <div key={level} style={{ marginBottom: '18px' }}>
                            {/* Level header — click to toggle all */}
                            <button
                              type="button"
                              onClick={() => toggleAll(level)}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center',
                                justifyContent: 'space-between', padding: '8px 14px',
                                background: col.bg, border: `1.5px solid ${col.border}`,
                                borderRadius: '10px', cursor: 'pointer', marginBottom: '8px',
                                transition: 'opacity 0.15s',
                              }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                  background: col.badge, color: '#fff',
                                  fontSize: '0.72rem', fontWeight: 700, padding: '2px 9px',
                                  borderRadius: '20px', letterSpacing: '0.03em',
                                }}>{level}</span>
                                <span style={{ fontSize: '0.82rem', color: col.text, fontWeight: 600 }}>
                                  {levelCourses.length} course{levelCourses.length !== 1 ? 's' : ''}
                                </span>
                              </span>
                              <span style={{ fontSize: '0.75rem', color: col.text, fontWeight: 500 }}>
                                {allSelected ? '✓ All selected' : someSelected ? 'Partial' : 'Select all'}
                              </span>
                            </button>

                            {/* Course cards */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {levelCourses.map(course => {
                                const selected = form.selected_courses.includes(course.id);
                                return (
                                  <label
                                    key={course.id}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: '12px',
                                      padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                                      border: selected ? `1.5px solid ${col.border}` : '1.5px solid var(--border)',
                                      background: selected ? col.bg : 'var(--bg-card, #fff)',
                                      transition: 'all 0.15s',
                                    }}
                                  >
                                    {/* Custom checkbox */}
                                    <span style={{
                                      width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
                                      border: selected ? `2px solid ${col.badge}` : '2px solid var(--border)',
                                      background: selected ? col.badge : 'transparent',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      transition: 'all 0.15s',
                                    }}>
                                      {selected && (
                                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                          <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                      )}
                                    </span>
                                    <input
                                      type="checkbox"
                                      style={{ display: 'none' }}
                                      checked={selected}
                                      onChange={() => toggleCourse(course.id)}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontWeight: 600, fontSize: '0.88rem', display: 'flex', gap: '6px', alignItems: 'baseline' }}>
                                        <code style={{ fontSize: '0.8rem', color: col.text, background: col.bg, padding: '1px 5px', borderRadius: '4px' }}>
                                          {course.code}
                                        </code>
                                        <span style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {course.title}
                                        </span>
                                      </div>
                                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        {course.credits} credit{course.credits !== 1 ? 's' : ''}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Selected count summary */}
                  {form.selected_courses.length > 0 && (
                    <div style={{
                      fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 500,
                      padding: '6px 12px', background: 'var(--primary-light, #eff6ff)',
                      borderRadius: '8px', marginBottom: '12px', textAlign: 'center',
                    }}>
                      {form.selected_courses.length} course{form.selected_courses.length !== 1 ? 's' : ''} selected
                    </div>
                  )}

                  <div className="btn-group">
                    <button className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading}>
                      {loading ? 'Registering...' : 'Complete Registration'}
                    </button>
                  </div>
                </>
              );
            })()}


            <div style={{ textAlign: 'center', marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button className="btn btn-ghost btn-sm" onClick={onBack}>
                Choose a different account type
              </button>
              <Link to="/auth/login" className="btn btn-ghost btn-sm">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
