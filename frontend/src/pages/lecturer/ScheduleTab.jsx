/**
 * Schedule Tab with Calendar View, Timetable Summary, Cancel & Reschedule.
 * Shows a monthly calendar with session dots, timetable info from admin,
 * and lets lecturers cancel or reschedule individual sessions.
 */
import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function ScheduleTab({ courseId, course }) {
  const [sessions, setSessions] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('calendar');
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [rescheduleSession, setRescheduleSession] = useState(null); // session being rescheduled
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', start_time: '', end_time: '' });
  const [addForm, setAddForm] = useState({
    date: '', start_time: '', end_time: '', attendance_window_minutes: 30,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sessRes, ttRes] = await Promise.all([
        api.get(`/attendance/sessions/?course_id=${courseId}`),
        api.get(`/attendance/timetable/?course_id=${courseId}`),
      ]);
      setSessions(sessRes.data);
      setTimetable(ttRes.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [courseId]);

  const sessionsByDate = useMemo(() => {
    const map = {};
    sessions.forEach(s => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [sessions]);

  // --- Actions ---
  const handleAddSession = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendance/sessions/', {
        course: parseInt(courseId, 10),
        ...addForm,
        attendance_window_minutes: parseInt(addForm.attendance_window_minutes, 10),
      });
      setShowAddModal(false);
      setAddForm({ date: '', start_time: '', end_time: '', attendance_window_minutes: 30 });
      fetchData();
    } catch (err) {
      alert(err.response?.data ? JSON.stringify(err.response.data) : 'Failed to create session.');
    }
  };

  const cancelSession = async (session) => {
    try {
      await api.patch(`/attendance/sessions/${session.id}/`, { cancelled: true });
      setSelectedDate(null);
      fetchData();
    } catch { alert('Failed to cancel session.'); }
  };

  const restoreSession = async (session) => {
    try {
      await api.patch(`/attendance/sessions/${session.id}/`, { cancelled: false });
      setSelectedDate(null);
      fetchData();
    } catch { alert('Failed to restore session.'); }
  };

  const openReschedule = (session) => {
    setRescheduleSession(session);
    setRescheduleForm({
      date: session.date,
      start_time: session.start_time?.slice(0, 5) || '',
      end_time: session.end_time?.slice(0, 5) || '',
    });
    setSelectedDate(null);
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/attendance/sessions/${rescheduleSession.id}/`, {
        date: rescheduleForm.date,
        start_time: rescheduleForm.start_time,
        end_time: rescheduleForm.end_time,
      });
      setRescheduleSession(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data ? JSON.stringify(err.response.data) : 'Failed to reschedule.');
    }
  };

  // Calendar helpers
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const getDateStr = (day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const goToday = () => setCurrentMonth(new Date());

  const selectedSessions = selectedDate ? (sessionsByDate[selectedDate] || []) : [];

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;

  return (
    <div>
      {/* Course Info + Timetable Summary */}
      <div className="card" style={{ marginBottom: '20px', border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', borderLeft: '4px solid #2E7D32' }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <h4 style={{ fontSize: '0.9rem', color: '#1a1a2e', margin: 0 }}>Course Timetable</h4>
            {course && (
              <span style={{ fontSize: '0.75rem', color: '#8896a7', marginLeft: 'auto' }}>
                {course.level} -- {course.department} Engineering
              </span>
            )}
          </div>

          {timetable.length > 0 ? (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {timetable.map(slot => (
                <div key={slot.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: '#f0fdf4', padding: '8px 16px', borderRadius: '10px',
                  border: '1px solid #c8e6c9',
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#2E7D32' }}>
                    {slot.day_name}
                  </div>
                  <div style={{ color: '#4a5568', fontSize: '0.82rem', fontWeight: 500 }}>
                    {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#a0aec0' }}>
                    ({slot.num_weeks} weeks from {slot.semester_start})
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.82rem', color: '#a0aec0', margin: 0 }}>
              No timetable set by admin yet. You can add sessions manually below.
            </p>
          )}
        </div>
      </div>

      {/* View Toggle + Actions */}
      <div className="flex-between mb-2">
        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', borderRadius: '10px', padding: '3px' }}>
          <button onClick={() => setView('calendar')}
            style={{ border: 'none', borderRadius: '8px', padding: '7px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              background: view === 'calendar' ? '#fff' : 'transparent',
              color: view === 'calendar' ? '#2E7D32' : '#8896a7',
              boxShadow: view === 'calendar' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '5px', verticalAlign: '-2px' }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Calendar
          </button>
          <button onClick={() => setView('list')}
            style={{ border: 'none', borderRadius: '8px', padding: '7px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              background: view === 'list' ? '#fff' : 'transparent',
              color: view === 'list' ? '#2E7D32' : '#8896a7',
              boxShadow: view === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '5px', verticalAlign: '-2px' }}>
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            List
          </button>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}
          style={{ borderRadius: '8px', background: 'linear-gradient(135deg, #2E7D32, #388e3c)', boxShadow: '0 2px 6px rgba(46,125,50,0.2)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Session
        </button>
      </div>

      {/* Calendar View */}
      {view === 'calendar' && (
        <div className="card" style={{ border: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="card-body" style={{ padding: '20px' }}>
            {/* Month navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <button className="btn btn-ghost btn-sm" onClick={prevMonth} style={{ padding: '6px 10px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>
                  {MONTHS[month]} {year}
                </h3>
                <button className="btn btn-ghost btn-sm" onClick={goToday} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>Today</button>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={nextMonth} style={{ padding: '6px 10px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>

            {/* Calendar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: '#eef0f2', borderRadius: '12px', overflow: 'hidden' }}>
              {DAYS.map(d => (
                <div key={d} style={{
                  padding: '10px 0', textAlign: 'center', fontSize: '0.72rem', fontWeight: 700,
                  color: '#8896a7', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc',
                }}>{d}</div>
              ))}
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={`e-${idx}`} style={{ background: '#fafbfc', minHeight: '80px' }} />;
                const dateStr = getDateStr(day);
                const daySessions = sessionsByDate[dateStr] || [];
                const isToday = dateStr === todayStr;
                const isPast = new Date(dateStr) < new Date(todayStr);

                return (
                  <div key={dateStr}
                    onClick={() => daySessions.length > 0 && setSelectedDate(dateStr)}
                    style={{
                      background: isToday ? '#f0fdf4' : '#fff', minHeight: '80px', padding: '8px',
                      cursor: daySessions.length > 0 ? 'pointer' : 'default', position: 'relative',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => { if (daySessions.length > 0) e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isToday ? '#f0fdf4' : '#fff'; }}
                  >
                    <div style={{
                      fontSize: '0.82rem', fontWeight: isToday ? 800 : 500,
                      color: isToday ? '#2E7D32' : isPast ? '#a0aec0' : '#1a1a2e', marginBottom: '6px',
                    }}>
                      {isToday ? (
                        <span style={{
                          background: '#2E7D32', color: '#fff', width: '26px', height: '26px',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: '50%', fontSize: '0.78rem',
                        }}>{day}</span>
                      ) : day}
                    </div>
                    {daySessions.map(s => (
                      <div key={s.id} style={{
                        background: s.cancelled ? '#fef2f2' : '#e8f5e9',
                        color: s.cancelled ? '#dc2626' : '#2E7D32',
                        padding: '2px 6px', borderRadius: '4px',
                        fontSize: '0.68rem', fontWeight: 600, marginBottom: '2px',
                        textDecoration: s.cancelled ? 'line-through' : 'none',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {s.start_time?.slice(0, 5)}
                        {s.attendance_count > 0 && ` (${s.attendance_count})`}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '20px', marginTop: '16px', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#8896a7' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#e8f5e9' }} /> Active
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#8896a7' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#fef2f2' }} /> Cancelled
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#8896a7' }}>
                <div style={{ width: '26px', height: '10px', borderRadius: '3px', background: '#2E7D32' }} /> Today
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <>
          {sessions.length === 0 ? (
            <div className="card" style={{ border: 'none' }}>
              <div className="empty-state">
                <h3>No Sessions Scheduled</h3>
                <p>Add sessions manually or ask your admin to set up a timetable.</p>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, border: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div className="table-container" style={{ border: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Week</th><th>Date</th><th>Day</th><th>Time</th><th>Attendance</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session, idx) => {
                      const d = new Date(session.date);
                      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
                      return (
                        <tr key={session.id} style={{ opacity: session.cancelled ? 0.55 : 1 }}>
                          <td><span style={{ fontWeight: 700, color: '#8896a7', fontSize: '0.82rem' }}>W{sessions.length - idx}</span></td>
                          <td style={{ fontWeight: 600 }}>{session.date}</td>
                          <td>{dayName}</td>
                          <td>{session.start_time?.slice(0, 5)} - {session.end_time?.slice(0, 5)}</td>
                          <td>
                            <span style={{ fontWeight: 700, color: session.attendance_count > 0 ? '#2E7D32' : '#a0aec0' }}>
                              {session.attendance_count}
                            </span>
                          </td>
                          <td>
                            {session.cancelled ? (
                              <span className="badge badge-danger">Cancelled</span>
                            ) : (
                              <span className="badge badge-success">Active</span>
                            )}
                          </td>
                          <td>
                            <div className="btn-group">
                              {session.cancelled ? (
                                <button className="btn btn-ghost btn-sm" style={{ color: '#2E7D32', fontWeight: 600 }}
                                  onClick={() => restoreSession(session)}>
                                  Restore
                                </button>
                              ) : (
                                <>
                                  <button className="btn btn-ghost btn-sm" style={{ color: '#dc2626', fontWeight: 600 }}
                                    onClick={() => cancelSession(session)}>
                                    Cancel
                                  </button>
                                  <button className="btn btn-ghost btn-sm" style={{ color: '#1565c0', fontWeight: 600 }}
                                    onClick={() => openReschedule(session)}>
                                    Reschedule
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Selected Date Detail Modal */}
      {selectedDate && (
        <div className="modal-overlay" onClick={() => setSelectedDate(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
              <button className="modal-close" onClick={() => setSelectedDate(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body" style={{ padding: '16px 24px' }}>
              {selectedSessions.map(s => (
                <div key={s.id} style={{
                  padding: '16px', border: '1px solid #eef0f2', borderRadius: '12px',
                  marginBottom: '12px', background: s.cancelled ? '#fefafa' : '#fafbfc',
                }}>
                  {/* Session info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: s.cancelled ? '#dc2626' : '#1a1a2e' }}>
                        {s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#8896a7', marginTop: '2px' }}>
                        {s.attendance_count} student{s.attendance_count !== 1 ? 's' : ''} marked present
                      </div>
                    </div>
                    {s.cancelled && (
                      <span style={{
                        background: '#ffebee', color: '#c62828', padding: '3px 10px',
                        borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                      }}>CANCELLED</span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {s.cancelled ? (
                      <button className="btn btn-primary btn-sm btn-full" onClick={() => restoreSession(s)}
                        style={{ borderRadius: '8px', background: 'linear-gradient(135deg, #2E7D32, #388e3c)', justifyContent: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                          <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                        </svg>
                        Restore Class
                      </button>
                    ) : (
                      <>
                        <button className="btn btn-sm" onClick={() => cancelSession(s)}
                          style={{
                            flex: 1, borderRadius: '8px', justifyContent: 'center',
                            background: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2',
                            fontWeight: 600, padding: '9px 14px', cursor: 'pointer',
                            fontFamily: 'var(--font-family)', fontSize: '0.82rem',
                            display: 'flex', alignItems: 'center', gap: '6px',
                          }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                          Cancel Class
                        </button>
                        <button className="btn btn-sm" onClick={() => openReschedule(s)}
                          style={{
                            flex: 1, borderRadius: '8px', justifyContent: 'center',
                            background: '#e3f2fd', color: '#1565c0', border: '1px solid #bbdefb',
                            fontWeight: 600, padding: '9px 14px', cursor: 'pointer',
                            fontFamily: 'var(--font-family)', fontSize: '0.82rem',
                            display: 'flex', alignItems: 'center', gap: '6px',
                          }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          Reschedule
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleSession && (
        <div className="modal-overlay" onClick={() => setRescheduleSession(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div>
                <h3>Reschedule Class</h3>
                <p style={{ fontSize: '0.82rem', color: '#8896a7', margin: 0 }}>
                  Moving class from {rescheduleSession.date} ({rescheduleSession.start_time?.slice(0, 5)})
                </p>
              </div>
              <button className="modal-close" onClick={() => setRescheduleSession(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleReschedule}>
              <div className="modal-body">
                {/* Current session info */}
                <div style={{
                  padding: '12px 16px', background: '#fef2f2', borderRadius: '10px',
                  marginBottom: '18px', fontSize: '0.82rem', color: '#c62828',
                  border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Old: {rescheduleSession.date} -- {rescheduleSession.start_time?.slice(0, 5)} to {rescheduleSession.end_time?.slice(0, 5)}
                </div>

                <div className="form-group">
                  <label className="form-label">New Date</label>
                  <input type="date" className="form-input" value={rescheduleForm.date}
                    onChange={e => setRescheduleForm(p => ({ ...p, date: e.target.value }))} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">New Start Time</label>
                    <input type="time" className="form-input" value={rescheduleForm.start_time}
                      onChange={e => setRescheduleForm(p => ({ ...p, start_time: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">New End Time</label>
                    <input type="time" className="form-input" value={rescheduleForm.end_time}
                      onChange={e => setRescheduleForm(p => ({ ...p, end_time: e.target.value }))} required />
                  </div>
                </div>

                {/* New date preview */}
                {rescheduleForm.date && (
                  <div style={{
                    padding: '12px 16px', background: '#f0fdf4', borderRadius: '10px',
                    fontSize: '0.82rem', color: '#2E7D32', border: '1px solid #bbf7d0',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    New: {rescheduleForm.date} -- {rescheduleForm.start_time || '?'} to {rescheduleForm.end_time || '?'}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setRescheduleSession(null)}
                  style={{ borderRadius: '8px' }}>Cancel</button>
                <button type="submit" className="btn btn-primary"
                  style={{ borderRadius: '8px', background: 'linear-gradient(135deg, #1565c0, #1976d2)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Session Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Class Session</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddSession}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={addForm.date}
                    onChange={e => setAddForm(p => ({ ...p, date: e.target.value }))} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Start Time</label>
                    <input type="time" className="form-input" value={addForm.start_time}
                      onChange={e => setAddForm(p => ({ ...p, start_time: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Time</label>
                    <input type="time" className="form-input" value={addForm.end_time}
                      onChange={e => setAddForm(p => ({ ...p, end_time: e.target.value }))} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Attendance Window (minutes)</label>
                  <input type="number" className="form-input" value={addForm.attendance_window_minutes}
                    onChange={e => setAddForm(p => ({ ...p, attendance_window_minutes: e.target.value }))} required />
                  <div className="form-hint">How long after start time can students mark attendance.</div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)} style={{ borderRadius: '8px' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ borderRadius: '8px' }}>Create Session</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
