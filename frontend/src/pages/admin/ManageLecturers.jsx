/**
 * Admin: Manage Lecturers - view, assign courses, reset passwords.
 */
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Layout from '../../components/Layout';

export default function ManageLecturers() {
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [showReset, setShowReset] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const fetch = () => {
    setLoading(true);
    Promise.all([api.get('/auth/lecturers/'), api.get('/courses/')])
      .then(([l, c]) => { setLecturers(l.data); setCourses(c.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleAssign = async () => {
    if (!selectedCourse || !showAssign) return;
    try {
      await api.post('/courses/assign-lecturer/', {
        lecturer_id: showAssign.id,
        course_id: parseInt(selectedCourse, 10),
      });
      setShowAssign(null);
      setSelectedCourse('');
      alert('Course assigned successfully.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign.');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !showReset) return;
    try {
      await api.patch(`/auth/lecturers/${showReset.id}/`, { new_password: newPassword });
      setShowReset(null);
      setNewPassword('');
      alert('Password reset successfully.');
    } catch { alert('Failed to reset password.'); }
  };

  return (
    <Layout>
      <div className="page-header">
        <h1>Manage Lecturers</h1>
        <p>View lecturers, assign courses, and manage credentials</p>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner"></div></div>
      ) : lecturers.length === 0 ? (
        <div className="card"><div className="empty-state"><h3>No Lecturers</h3><p>No lecturers have registered yet.</p></div></div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th><th>Name</th><th>Email</th><th>Department</th><th>Levels</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lecturers.map(l => (
                  <tr key={l.id}>
                    <td>{l.title}</td>
                    <td><strong>{l.last_name}, {l.first_name}</strong></td>
                    <td>{l.email}</td>
                    <td>{l.department}</td>
                    <td>{(l.levels_taught || []).join(', ')}</td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowAssign(l)}>Assign Course</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowReset(l)}>Reset Password</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAssign && (
        <div className="modal-overlay" onClick={() => setShowAssign(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Course to {showAssign.title} {showAssign.last_name}</h3>
              <button className="modal-close" onClick={() => setShowAssign(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Select Course</label>
                <select className="form-select" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
                  <option value="">Choose a course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAssign(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssign} disabled={!selectedCourse}>Assign</button>
            </div>
          </div>
        </div>
      )}

      {showReset && (
        <div className="modal-overlay" onClick={() => setShowReset(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reset Password for {showReset.title} {showReset.last_name}</h3>
              <button className="modal-close" onClick={() => setShowReset(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" placeholder="Enter new password"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowReset(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleResetPassword} disabled={!newPassword}>Reset Password</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
