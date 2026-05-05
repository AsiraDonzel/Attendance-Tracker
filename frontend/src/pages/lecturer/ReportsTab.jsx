/**
 * Reports & Analytics Tab
 * Traditional attendance register grid: Students (rows) x Weeks (columns)
 * Plus summary stats, charts, and CSV export.
 */
import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../api/axios';

const COLORS = ['#2E7D32', '#d32f2f', '#f57c00', '#1976d2'];

const StatusCell = ({ status }) => {
  if (status === 'present') {
    return (
      <div style={{
        width: '26px', height: '26px', borderRadius: '6px',
        background: '#e8f5e9', color: '#2E7D32', display: 'flex',
        alignItems: 'center', justifyContent: 'center', margin: '0 auto',
        fontWeight: 800, fontSize: '0.82rem',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    );
  }
  if (status === 'excused') {
    return (
      <div style={{
        width: '26px', height: '26px', borderRadius: '6px',
        background: '#fff3e0', color: '#e65100', display: 'flex',
        alignItems: 'center', justifyContent: 'center', margin: '0 auto',
        fontWeight: 800, fontSize: '0.8rem',
      }}>
        E
      </div>
    );
  }
  // absent
  return (
    <div style={{
      width: '26px', height: '26px', borderRadius: '6px',
      background: '#ffebee', color: '#c62828', display: 'flex',
      alignItems: 'center', justifyContent: 'center', margin: '0 auto',
      fontWeight: 800, fontSize: '0.82rem',
    }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </div>
  );
};

export default function ReportsTab({ courseId, course }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    api.get(`/attendance/report/${courseId}/`)
      .then(res => setReport(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleExport = async () => {
    try {
      const res = await api.get(`/attendance/export/${courseId}/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${course.code}_attendance_report.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch { alert('Failed to export report.'); }
  };

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;
  if (!report) return <div className="empty-state"><p>Failed to load report data.</p></div>;

  const { sessions = [], report: students = [], total_sessions } = report;

  const barData = students.map(r => ({ name: r.matric_number, percentage: r.percentage }));
  const presentCount = students.filter(r => r.percentage >= 75).length;
  const lowCount = students.filter(r => r.percentage < 75 && r.percentage > 0).length;
  const absentCount = students.filter(r => r.percentage === 0).length;
  const pieData = [
    { name: '75%+ Attendance', value: presentCount },
    { name: 'Below 75%', value: lowCount },
    { name: 'No Attendance', value: absentCount },
  ].filter(d => d.value > 0);
  const avgPercentage = students.length > 0
    ? Math.round(students.reduce((s, r) => s + r.percentage, 0) / students.length) : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex-between mb-2">
        <h3 style={{ margin: 0 }}>Attendance Register</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowCharts(!showCharts)}
            style={{ borderRadius: '8px', border: '1px solid #e2e8f0', color: showCharts ? '#2E7D32' : '#8896a7', fontWeight: 600 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', verticalAlign: '-2px' }}>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            {showCharts ? 'Hide Charts' : 'Show Charts'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleExport}
            style={{ borderRadius: '8px', background: 'linear-gradient(135deg, #2E7D32, #388e3c)', boxShadow: '0 2px 6px rgba(46,125,50,0.2)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', verticalAlign: '-2px' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="stat-info">
            <h4>Sessions</h4>
            <div className="stat-value">{total_sessions}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <div className="stat-info">
            <h4>Students</h4>
            <div className="stat-value">{students.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div className="stat-info">
            <h4>Avg Attendance</h4>
            <div className="stat-value">{avgPercentage}%</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="stat-info">
            <h4>Below 75%</h4>
            <div className="stat-value">{lowCount + absentCount}</div>
          </div>
        </div>
      </div>

      {/* Attendance Register Grid */}
      <div className="card" style={{ padding: 0, border: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <div className="card-header" style={{ borderBottom: '1px solid #eef0f2', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#1a1a2e' }}>Weekly Attendance Register</h4>
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: '14px', fontSize: '0.75rem', color: '#8896a7' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#e8f5e9' }} />
              Present
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ffebee' }} />
              Absent
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#fff3e0' }} />
              Excused
            </div>
          </div>
        </div>

        {sessions.length === 0 || students.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px' }}>
            <h3>No Data Available</h3>
            <p>No sessions or students to display. Generate sessions from the timetable first.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem',
              minWidth: `${200 + sessions.length * 60}px`,
            }}>
              <thead>
                {/* Week number row */}
                <tr>
                  <th style={{
                    position: 'sticky', left: 0, background: '#f8fafc', zIndex: 2,
                    padding: '8px 16px', textAlign: 'left', borderBottom: '1px solid #eef0f2',
                    minWidth: '180px', fontSize: '0.72rem', color: '#8896a7', fontWeight: 700,
                  }}>
                    Student
                  </th>
                  {sessions.map(s => (
                    <th key={s.id} style={{
                      padding: '8px 4px', textAlign: 'center', borderBottom: '1px solid #eef0f2',
                      background: '#f8fafc', fontSize: '0.72rem', fontWeight: 700, color: '#2E7D32',
                      letterSpacing: '0.3px', minWidth: '54px',
                    }}>
                      W{s.week}
                    </th>
                  ))}
                  <th style={{
                    padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #eef0f2',
                    background: '#f8fafc', fontSize: '0.72rem', fontWeight: 700, color: '#1a1a2e',
                    minWidth: '60px',
                  }}>
                    Total
                  </th>
                  <th style={{
                    padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #eef0f2',
                    background: '#f8fafc', fontSize: '0.72rem', fontWeight: 700, color: '#1a1a2e',
                    minWidth: '60px',
                  }}>
                    %
                  </th>
                </tr>
                {/* Date row */}
                <tr>
                  <td style={{
                    position: 'sticky', left: 0, background: '#fafbfc', zIndex: 2,
                    padding: '4px 16px', textAlign: 'left', borderBottom: '2px solid #e2e8f0',
                    fontSize: '0.68rem', color: '#a0aec0',
                  }}>
                    Date
                  </td>
                  {sessions.map(s => (
                    <td key={`d-${s.id}`} style={{
                      padding: '4px 4px', textAlign: 'center', borderBottom: '2px solid #e2e8f0',
                      background: '#fafbfc', fontSize: '0.68rem', color: '#a0aec0',
                      whiteSpace: 'nowrap',
                    }}>
                      <div>{s.day_name}</div>
                      <div>{s.date.slice(5)}</div>
                    </td>
                  ))}
                  <td style={{ borderBottom: '2px solid #e2e8f0', background: '#fafbfc' }}></td>
                  <td style={{ borderBottom: '2px solid #e2e8f0', background: '#fafbfc' }}></td>
                </tr>
              </thead>
              <tbody>
                {students.map((student, sIdx) => (
                  <tr key={student.student_id}
                    style={{ background: sIdx % 2 === 0 ? '#fff' : '#fafbfc' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                    onMouseLeave={e => e.currentTarget.style.background = sIdx % 2 === 0 ? '#fff' : '#fafbfc'}
                  >
                    <td style={{
                      position: 'sticky', left: 0, zIndex: 1,
                      padding: '10px 16px', borderBottom: '1px solid #f0f2f5',
                      background: 'inherit', whiteSpace: 'nowrap',
                    }}>
                      <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.82rem' }}>
                        {student.matric_number}
                      </div>
                      <div style={{ color: '#8896a7', fontSize: '0.72rem' }}>
                        {student.full_name}
                      </div>
                    </td>
                    {(student.session_statuses || []).map((ss, i) => (
                      <td key={`${student.student_id}-${ss.session_id}`} style={{
                        padding: '6px 4px', textAlign: 'center',
                        borderBottom: '1px solid #f0f2f5',
                      }}>
                        <StatusCell status={ss.status} />
                      </td>
                    ))}
                    <td style={{
                      padding: '6px 12px', textAlign: 'center',
                      borderBottom: '1px solid #f0f2f5', fontWeight: 700,
                      color: '#1a1a2e', fontSize: '0.88rem',
                    }}>
                      {student.attended}/{total_sessions}
                    </td>
                    <td style={{
                      padding: '6px 12px', textAlign: 'center',
                      borderBottom: '1px solid #f0f2f5',
                    }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: '6px',
                        fontSize: '0.78rem', fontWeight: 700,
                        background: student.percentage >= 75 ? '#e8f5e9' : student.percentage >= 50 ? '#fff3e0' : '#ffebee',
                        color: student.percentage >= 75 ? '#2E7D32' : student.percentage >= 50 ? '#e65100' : '#c62828',
                      }}>
                        {student.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Charts toggle */}
      {showCharts && (
        <div className="charts-grid" style={{ marginTop: 0 }}>
          <div className="chart-card" style={{ border: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h4>Attendance Percentage per Student</h4>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" fontSize={11} angle={-30} textAnchor="end" height={60} />
                  <YAxis domain={[0, 100]} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted" style={{ padding: '40px', textAlign: 'center' }}>No data available</p>}
          </div>

          <div className="chart-card" style={{ border: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h4>Overall Attendance Distribution</h4>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-muted" style={{ padding: '40px', textAlign: 'center' }}>No data available</p>}
          </div>
        </div>
      )}
    </div>
  );
}
