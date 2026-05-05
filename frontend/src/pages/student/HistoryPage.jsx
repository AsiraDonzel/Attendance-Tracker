/**
 * Student Attendance History Page.
 * Displays a table of all past class sessions and the student's status.
 */
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Layout from '../../components/Layout';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    api.get('/attendance/student/history/')
      .then(res => setHistory(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="loading-center"><div className="spinner"></div></div></Layout>;

  // Get unique courses for filter
  const courses = ['All', ...new Set(history.map(item => item.course_code))];
  
  const filteredHistory = filter === 'All' 
    ? history 
    : history.filter(item => item.course_code === filter);

  return (
    <Layout>
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1>Attendance History</h1>
            <p>Review your attendance records for past classes.</p>
          </div>
          <div>
            <select className="form-input" value={filter} onChange={e => setFilter(e.target.value)} style={{ minWidth: '150px' }}>
              {courses.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'All Courses' : c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card slide-up" style={{ padding: 0, border: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Course</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#8896a7' }}>
                    No past sessions found.
                  </td>
                </tr>
              ) : filteredHistory.map(session => {
                const isPresent = session.status === 'present' || session.status === 'excused';
                return (
                  <tr key={session.id}>
                    <td style={{ fontWeight: 600 }}>{session.date}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#1a1a2e' }}>{session.course_code}</div>
                      <div style={{ fontSize: '0.8rem', color: '#8896a7' }}>{session.course_title}</div>
                    </td>
                    <td>{session.start_time} - {session.end_time}</td>
                    <td>
                      <span className={`badge ${isPresent ? 'badge-success' : 'badge-danger'}`} style={{ minWidth: '80px', textAlign: 'center' }}>
                        {session.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
