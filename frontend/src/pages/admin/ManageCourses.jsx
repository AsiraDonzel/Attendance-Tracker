/**
 * Admin: Manage Courses - CRUD operations for courses + timetable management.
 */
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import { DEPARTMENTS, LEVELS } from '../../utils/constants';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: '', title: '', level: '', department: '', credits: 3, description: '' });

  // Timetable state
  const [showTimetable, setShowTimetable] = useState(null); // course object or null
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [ttLoading, setTtLoading] = useState(false);
  const [showTtForm, setShowTtForm] = useState(false);
  const [ttForm, setTtForm] = useState({
    day_of_week: '', start_time: '', end_time: '',
    attendance_window_minutes: 30, semester_start: '', num_weeks: 13,
  });
  const [generating, setGenerating] = useState(null); // slot id being generated
  const [genResult, setGenResult] = useState(null);

  const fetchCourses = () => {
    setLoading(true);
    api.get('/courses/')
      .then(res => setCourses(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCourses(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: '', title: '', level: '', department: '', credits: 3, description: '' });
    setShowModal(true);
  };

  const openEdit = (course) => {
    setEditing(course);
    setForm({ code: course.code, title: course.title, level: course.level, department: course.department, credits: course.credits, description: course.description || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.patch(`/courses/${editing.id}/`, form);
      } else {
        await api.post('/courses/', form);
      }
      setShowModal(false);
      fetchCourses();
    } catch (err) {
      alert(err.response?.data ? JSON.stringify(err.response.data) : 'Failed.');
    }
  };

  const handleDelete = async (course) => {
    if (!confirm(`Delete ${course.code}?`)) return;
    try {
      await api.delete(`/courses/${course.id}/`);
      fetchCourses();
    } catch { alert('Failed to delete course.'); }
  };

  // --- Timetable functions ---
  const openTimetable = async (course) => {
    setShowTimetable(course);
    setTtLoading(true);
    setGenResult(null);
    try {
      const res = await api.get(`/attendance/timetable/?course_id=${course.id}`);
      setTimetableSlots(res.data);
    } catch { setTimetableSlots([]); }
    setTtLoading(false);
  };

  const handleTtSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendance/timetable/', {
        course: showTimetable.id,
        day_of_week: parseInt(ttForm.day_of_week, 10),
        start_time: ttForm.start_time,
        end_time: ttForm.end_time,
        attendance_window_minutes: parseInt(ttForm.attendance_window_minutes, 10),
        semester_start: ttForm.semester_start,
        num_weeks: parseInt(ttForm.num_weeks, 10),
      });
      setShowTtForm(false);
      setTtForm({ day_of_week: '', start_time: '', end_time: '', attendance_window_minutes: 30, semester_start: '', num_weeks: 13 });
      openTimetable(showTimetable);
    } catch (err) {
      alert(err.response?.data ? JSON.stringify(err.response.data) : 'Failed to create timetable slot.');
    }
  };

  const deleteTtSlot = async (slotId) => {
    try {
      await api.delete(`/attendance/timetable/${slotId}/`);
      openTimetable(showTimetable);
    } catch { alert('Failed to delete.'); }
  };

  const generateSessions = async (slotId) => {
    setGenerating(slotId);
    setGenResult(null);
    try {
      const res = await api.post('/attendance/generate-sessions/', { timetable_id: slotId });
      setGenResult(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate sessions.');
    }
    setGenerating(null);
  };

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>Manage Courses</h1>
            <p>Create, edit, and manage course timetables</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}
            style={{ borderRadius: '8px', background: 'linear-gradient(135deg, #2E7D32, #388e3c)', boxShadow: '0 2px 6px rgba(46,125,50,0.2)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Course
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner"></div></div>
      ) : courses.length === 0 ? (
        <div className="card"><div className="empty-state"><h3>No Courses</h3><p>Click "Add Course" to create one.</p></div></div>
      ) : (
        <div className="card" style={{ padding: 0, border: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th><th>Title</th><th>Level</th><th>Department</th><th>Credits</th><th>Students</th><th>Lecturers</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.code}</strong></td>
                    <td>{c.title}</td>
                    <td>{c.level}</td>
                    <td>{c.department}</td>
                    <td>{c.credits}</td>
                    <td>{c.student_count}</td>
                    <td>{c.lecturer_count}</td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-ghost btn-sm" onClick={() => openTimetable(c)}
                          style={{ color: '#2E7D32', fontWeight: 600 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '3px' }}>
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          Timetable
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Edit</button>
                        <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDelete(c)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Course Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Course' : 'Add Course'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Course Code</label>
                    <input className="form-input" placeholder="e.g. CSC 301" value={form.code}
                      onChange={e => setForm(p => ({ ...p, code: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Credits</label>
                    <input type="number" className="form-input" value={form.credits}
                      onChange={e => setForm(p => ({ ...p, credits: parseInt(e.target.value, 10) }))} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="form-input" placeholder="Course title" value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Level</label>
                    <select className="form-select" value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))} required>
                      <option value="">Select</option>
                      {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select className="form-select" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} required>
                      <option value="">Select</option>
                      {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description (optional)</label>
                  <textarea className="form-textarea" value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ borderRadius: '8px' }}>{editing ? 'Save Changes' : 'Create Course'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timetable Management Modal */}
      {showTimetable && (
        <div className="modal-overlay" onClick={() => { setShowTimetable(null); setGenResult(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ marginBottom: '2px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: '-3px' }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Timetable: {showTimetable.code}
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#8896a7', margin: 0 }}>{showTimetable.title}</p>
              </div>
              <button className="modal-close" onClick={() => { setShowTimetable(null); setGenResult(null); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body" style={{ padding: '16px 24px' }}>
              {/* Success message */}
              {genResult && (
                <div style={{
                  padding: '12px 16px', background: '#f0fdf4', color: '#16a34a',
                  borderRadius: '10px', fontSize: '0.85rem', marginBottom: '16px',
                  fontWeight: 500, border: '1px solid #bbf7d0',
                }}>
                  {genResult.message} ({genResult.skipped} already existed)
                </div>
              )}

              {ttLoading ? (
                <div className="loading-center"><div className="spinner"></div></div>
              ) : timetableSlots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#8896a7' }}>
                  <p>No timetable slots set for this course yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {timetableSlots.map(slot => (
                    <div key={slot.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 16px', border: '1px solid #eef0f2', borderRadius: '12px',
                      background: '#fafbfc',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          background: '#e8f5e9', color: '#2E7D32', padding: '6px 12px',
                          borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', minWidth: '90px', textAlign: 'center',
                        }}>
                          {slot.day_name}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a1a2e' }}>
                            {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>
                            Starts {slot.semester_start} -- {slot.num_weeks} weeks
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-primary btn-sm"
                          disabled={generating === slot.id}
                          onClick={() => generateSessions(slot.id)}
                          style={{ borderRadius: '8px', fontSize: '0.78rem', padding: '6px 12px',
                            background: 'linear-gradient(135deg, #2E7D32, #388e3c)', boxShadow: '0 1px 4px rgba(46,125,50,0.2)' }}>
                          {generating === slot.id ? 'Generating...' : 'Generate Sessions'}
                        </button>
                        <button className="btn btn-ghost btn-sm text-danger" onClick={() => deleteTtSlot(slot.id)}
                          style={{ fontSize: '0.78rem', padding: '6px 10px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Slot Form */}
              {!showTtForm ? (
                <button className="btn btn-secondary btn-full" onClick={() => setShowTtForm(true)}
                  style={{ borderRadius: '10px', border: '1.5px dashed #cbd5e1', color: '#8896a7', fontWeight: 600, padding: '12px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Time Slot
                </button>
              ) : (
                <form onSubmit={handleTtSubmit} style={{
                  padding: '18px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff',
                }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '14px', color: '#1a1a2e' }}>New Time Slot</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Day of Week</label>
                      <select className="form-select" value={ttForm.day_of_week}
                        onChange={e => setTtForm(p => ({ ...p, day_of_week: e.target.value }))} required>
                        <option value="">Select day</option>
                        {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Attendance Window</label>
                      <input type="number" className="form-input" value={ttForm.attendance_window_minutes}
                        onChange={e => setTtForm(p => ({ ...p, attendance_window_minutes: e.target.value }))}
                        required />
                      <div className="form-hint">Minutes after start</div>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Start Time</label>
                      <input type="time" className="form-input" value={ttForm.start_time}
                        onChange={e => setTtForm(p => ({ ...p, start_time: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">End Time</label>
                      <input type="time" className="form-input" value={ttForm.end_time}
                        onChange={e => setTtForm(p => ({ ...p, end_time: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Semester Start Date</label>
                      <input type="date" className="form-input" value={ttForm.semester_start}
                        onChange={e => setTtForm(p => ({ ...p, semester_start: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Number of Weeks</label>
                      <input type="number" className="form-input" value={ttForm.num_weeks}
                        onChange={e => setTtForm(p => ({ ...p, num_weeks: e.target.value }))} required min={1} max={20} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowTtForm(false)} style={{ borderRadius: '8px' }}>Cancel</button>
                    <button type="submit" className="btn btn-primary btn-sm" style={{ borderRadius: '8px', background: 'linear-gradient(135deg, #2E7D32, #388e3c)' }}>Add Slot</button>
                  </div>
                </form>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowTimetable(null); setGenResult(null); }}
                style={{ borderRadius: '8px' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
