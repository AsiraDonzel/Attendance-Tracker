/**
 * Student Dashboard Page.
 * Displays profile overview, today's courses, weekly schedule, and attendance summaries.
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [marking, setMarking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/attendance/student/dashboard/')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const triggerOtpModal = (session_id) => {
    setSelectedSession(session_id);
    setOtp('');
    setOtpError('');
    setShowOtpModal(true);
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    if (!otp) return;
    setMarking(true);
    setOtpError('');
    
    try {
      await api.post('/attendance/mark/', {
        fingerprint_id: data.profile.fingerprint_id,
        otp: otp,
        session_id: selectedSession
      });
      // Update local state to reflect marked attendance
      setData(prev => {
        const newToday = prev.today_courses.map(c => 
          c.id === selectedSession ? { ...c, status: 'marked' } : c
        );
        return { ...prev, today_courses: newToday };
      });
      setShowOtpModal(false);
    } catch (err) {
      setOtpError(err.response?.data?.error || 'Verification failed. Incorrect OTP.');
    } finally {
      setMarking(false);
    }
  };

  if (loading) return <Layout><div className="loading-center"><div className="spinner"></div></div></Layout>;
  if (!data) return <Layout><div className="empty-state">Failed to load dashboard data.</div></Layout>;

  const { profile, today_courses, weekly_schedule, attendance_summary, upcoming_classes } = data;

  // Build weekly grid (Mon-Fri)
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const gridData = days.map(d => ({
    day: d,
    sessions: weekly_schedule.filter(s => s.day_name === d)
  }));

  return (
    <Layout>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1a2332, #233044)',
        borderRadius: '16px', padding: '36px 40px', marginBottom: '32px',
        color: '#fff', position: 'relative', overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', blur: '20px' }} />
        <div style={{ position: 'absolute', bottom: '-40px', right: '80px', width: '100px', height: '100px', background: 'rgba(46,125,50,0.2)', borderRadius: '50%' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '6px' }}>
              Welcome back, {profile.full_name.split(' ')[0]}!
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.05rem', margin: 0 }}>
              {profile.department} Engineering • {profile.level}
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Matriculation Number</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '1px' }}>{profile.matric_number}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* Today's Courses */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2E7D32' }} />
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1a1a2e', margin: 0 }}>Today's Schedule</h2>
            </div>

            {today_courses.length === 0 ? (
              <div className="card" style={{ padding: '30px', textAlign: 'center', border: 'none', background: '#f8fafc' }}>
                <p style={{ color: '#8896a7', margin: 0 }}>No classes scheduled for today.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {today_courses.map(course => {
                  const isActive = course.status === 'active';
                  const isCompleted = course.status === 'completed' || course.status === 'marked';
                  
                  return (
                    <div key={course.id} className="slide-up" style={{
                      background: isActive ? '#fff' : '#fafbfc',
                      borderRadius: '16px', overflow: 'hidden',
                      border: isActive ? '1px solid #c8e6c9' : '1px solid #eef0f2',
                      boxShadow: isActive ? '0 4px 20px rgba(46,125,50,0.08)' : 'none',
                      opacity: isCompleted ? 0.7 : 1, transition: 'all 0.2s ease',
                    }}>
                      <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 800, color: isActive ? '#2E7D32' : '#4a5568', fontSize: '1.1rem' }}>
                              {course.course_code}
                            </span>
                            {/* Badges */}
                            {course.status === 'active' && <span className="badge" style={{ background: '#e8f5e9', color: '#2E7D32' }}>Active Now</span>}
                            {course.status === 'marked' && <span className="badge" style={{ background: '#e3f2fd', color: '#1565c0' }}>Marked Present</span>}
                            {course.status === 'completed' && <span className="badge" style={{ background: '#f1f5f9', color: '#4a5568' }}>Completed</span>}
                            {course.status === 'inactive' && <span className="badge" style={{ background: '#fef2f2', color: '#dc2626' }}>Missed</span>}
                            {course.status === 'upcoming_today' && <span className="badge" style={{ background: '#fff3e0', color: '#e65100' }}>Starts at {course.start_time}</span>}
                          </div>
                          <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', color: '#1a1a2e' }}>{course.course_title}</h3>
                          
                          <div style={{ display: 'flex', gap: '20px', color: '#8896a7', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                              {course.start_time} - {course.end_time}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                              {course.venue}
                            </div>
                          </div>
                        </div>

                        {/* Action section */}
                        {isActive && (
                          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', minWidth: '180px' }}>
                            <button className="btn btn-primary" onClick={() => triggerOtpModal(course.id)}
                              style={{ width: '100%', borderRadius: '10px', background: 'linear-gradient(135deg, #2E7D32, #388e3c)', padding: '12px', boxShadow: '0 4px 12px rgba(46,125,50,0.2)' }}>
                              Mark Attendance
                            </button>
                            <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#8896a7', textAlign: 'center' }}>
                              Window closes {course.window_minutes} mins after start
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Weekly Schedule Grid */}
          <section>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1a1a2e', marginBottom: '16px' }}>This Week</h2>
            <div className="card" style={{ border: 'none', padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', background: '#eef0f2', gap: '1px' }}>
                {gridData.map((col, idx) => (
                  <div key={idx} style={{ background: '#fff', minHeight: '200px' }}>
                    <div style={{ background: '#f8fafc', padding: '12px', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #eef0f2' }}>
                      {col.day.substring(0,3)}
                    </div>
                    <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {col.sessions.map(s => (
                        <div key={s.id} style={{ background: '#f0fdf4', border: '1px solid #c8e6c9', borderRadius: '8px', padding: '10px', fontSize: '0.82rem' }}>
                          <div style={{ fontWeight: 800, color: '#2E7D32', marginBottom: '4px' }}>{s.course_code}</div>
                          <div style={{ color: '#4a5568' }}>{s.start_time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Upcoming Classes */}
          <div className="card slide-up" style={{ padding: '24px', border: 'none', background: '#fafbfc' }}>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 16px 0', color: '#1a1a2e' }}>Upcoming Classes</h3>
            {upcoming_classes.length === 0 ? (
              <p style={{ color: '#8896a7', fontSize: '0.9rem', margin: 0 }}>No future classes scheduled.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {upcoming_classes.map((cls, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: idx < upcoming_classes.length - 1 ? '1px solid #eef0f2' : 'none' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e3f2fd', color: '#1565c0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                      {cls.date.slice(8,10)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.95rem' }}>{cls.course_code}</div>
                      <div style={{ color: '#8896a7', fontSize: '0.82rem' }}>{cls.start_time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attendance Summary */}
          <div className="card slide-up">
            <div className="card-header" style={{ paddingBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Course Attendance</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {attendance_summary.length === 0 ? (
                <p style={{ color: '#8896a7', fontSize: '0.9rem', margin: 0 }}>No course data available.</p>
              ) : attendance_summary.map(course => (
                <div key={course.course_id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.9rem' }}>{course.course_code}</span>
                    <span style={{ fontSize: '0.85rem', color: course.percentage >= 75 ? '#2E7D32' : course.percentage >= 50 ? '#e65100' : '#c62828' }}>
                      {course.percentage}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#eef0f2', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', width: `${course.percentage}%`, 
                      background: course.percentage >= 75 ? '#2E7D32' : course.percentage >= 50 ? '#f57c00' : '#d32f2f',
                      transition: 'width 0.5s ease-out'
                    }} />
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#8896a7', textAlign: 'right' }}>
                    Attended {course.attended} of {course.total_held} classes
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link to="/student/history" className="btn btn-secondary btn-full" style={{ borderRadius: '12px', padding: '12px' }}>
            View Full History
          </Link>

        </div>
      </div>

      {showOtpModal && (
        <div className="modal-overlay slide-up" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Verify Attendance</h3>
              <button 
                className="btn btn-ghost" 
                onClick={() => setShowOtpModal(false)}
                style={{ padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#4a5568', fontSize: '0.9rem', marginBottom: '16px' }}>
                Please enter the 6-digit OTP displayed on the classroom hardware device.
              </p>
              
              <form onSubmit={handleMarkAttendance}>
                {otpError && (
                  <div style={{
                    padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca',
                    borderRadius: '8px', color: '#c62828', fontSize: '0.85rem', marginBottom: '16px',
                  }}>
                    {otpError}
                  </div>
                )}
                
                <div className="form-group">
                  <label className="form-label">OTP Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="000 000"
                    style={{ letterSpacing: '2px', fontFamily: 'monospace', textAlign: 'center', fontSize: '1.2rem', padding: '12px' }}
                    maxLength="6"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary btn-full" 
                  disabled={marking}
                  style={{ background: 'linear-gradient(135deg, #2E7D32, #388e3c)', padding: '12px', borderRadius: '10px' }}
                >
                  {marking ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> : 'Confirm Presence'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
