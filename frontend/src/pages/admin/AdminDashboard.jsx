/**
 * Admin Dashboard - recent system logs and quick stats.
 */
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Layout from '../../components/Layout';

export default function AdminDashboard() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ students: 0, lecturers: 0, courses: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/logs/?limit=20'),
      api.get('/auth/students/'),
      api.get('/auth/lecturers/'),
      api.get('/courses/'),
    ])
      .then(([logsRes, studentsRes, lecturersRes, coursesRes]) => {
        setLogs(logsRes.data);
        setStats({
          students: studentsRes.data.length,
          lecturers: lecturersRes.data.length,
          courses: coursesRes.data.length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>System overview and recent activity</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <div className="stat-info">
            <h4>Students</h4>
            <div className="stat-value">{stats.students}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="stat-info">
            <h4>Lecturers</h4>
            <div className="stat-value">{stats.lecturers}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div className="stat-info">
            <h4>Courses</h4>
            <div className="stat-value">{stats.courses}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="card-header">
          <h3>Recent System Logs</h3>
        </div>
        {loading ? (
          <div className="loading-center"><div className="spinner"></div></div>
        ) : logs.length === 0 ? (
          <div className="empty-state"><p>No system logs yet.</p></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>{log.user_email || 'System'}</td>
                    <td>{log.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
