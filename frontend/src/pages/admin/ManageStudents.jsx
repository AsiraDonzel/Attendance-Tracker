/**
 * Admin: Manage Students - view, edit, reset fingerprint/TOTP, view attendance.
 */
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import { DEPARTMENTS, LEVELS } from '../../utils/constants';

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchStudents = () => {
    setLoading(true);
    api.get('/auth/students/')
      .then(res => setStudents(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStudents(); }, []);

  const openEdit = (s) => {
    setEditStudent(s);
    setEditForm({
      full_name: s.full_name,
      matric_number: s.matric_number,
      level: s.level,
      department: s.department,
      fingerprint_id: s.fingerprint_id,
    });
  };

  const handleSave = async () => {
    try {
      await api.patch(`/auth/students/${editStudent.id}/`, editForm);
      setEditStudent(null);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data ? JSON.stringify(err.response.data) : 'Failed to update.');
    }
  };

  const handleResetSecret = async (student) => {
    if (!confirm(`Reset TOTP secret for ${student.full_name}?`)) return;
    try {
      // Generate a random base32 secret (mock - in production use pyotp.random_base32())
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      let secret = '';
      for (let i = 0; i < 16; i++) secret += chars[Math.floor(Math.random() * chars.length)];
      await api.patch(`/auth/students/${student.id}/`, { totp_secret: secret });
      alert(`New TOTP secret: ${secret}`);
      fetchStudents();
    } catch { alert('Failed to reset secret.'); }
  };

  return (
    <Layout>
      <div className="page-header">
        <h1>Manage Students</h1>
        <p>View and edit student records, manage fingerprint IDs and TOTP secrets</p>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner"></div></div>
      ) : students.length === 0 ? (
        <div className="card"><div className="empty-state"><h3>No Students</h3><p>No students have registered yet.</p></div></div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Matric No</th><th>Name</th><th>Email</th><th>Department</th><th>Level</th><th>FP ID</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.matric_number}</strong></td>
                    <td>{s.full_name}</td>
                    <td>{s.email}</td>
                    <td>{s.department}</td>
                    <td>{s.level}</td>
                    <td>{s.fingerprint_id}</td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>Edit</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleResetSecret(s)}>Reset TOTP</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editStudent && (
        <div className="modal-overlay" onClick={() => setEditStudent(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Student</h3>
              <button className="modal-close" onClick={() => setEditStudent(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={editForm.full_name}
                  onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Matric Number</label>
                <input className="form-input" value={editForm.matric_number}
                  onChange={e => setEditForm(p => ({ ...p, matric_number: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Level</label>
                  <select className="form-select" value={editForm.level} onChange={e => setEditForm(p => ({ ...p, level: e.target.value }))}>
                    {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-select" value={editForm.department} onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))}>
                    {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Fingerprint ID</label>
                <input type="number" className="form-input" value={editForm.fingerprint_id}
                  onChange={e => setEditForm(p => ({ ...p, fingerprint_id: parseInt(e.target.value, 10) }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditStudent(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
