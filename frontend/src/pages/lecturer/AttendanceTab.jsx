/**
 * Attendance Monitoring Tab - View/override attendance for a specific session.
 */
import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function AttendanceTab({ courseId }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [records, setRecords] = useState([]);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/attendance/sessions/?course_id=${courseId}`)
      .then(res => {
        const active = res.data.filter(s => !s.cancelled);
        setSessions(active);
        if (active.length > 0) {
          setSelectedSession(String(active[0].id));
        }
      })
      .catch(() => {});
  }, [courseId]);

  useEffect(() => {
    if (selectedSession) {
      fetchAttendance(selectedSession);
    }
  }, [selectedSession]);

  const fetchAttendance = async (sessionId) => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance/sessions/${sessionId}/attendance/`);
      setRecords(res.data.records);
      setSessionInfo(res.data.session);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleOverride = async (record) => {
    if (!record.attendance_id) {
      // Create a new record as excused
      try {
        await api.post('/attendance/create-record/', {
          student_id: record.student_id,
          session_id: parseInt(selectedSession, 10),
          status: 'excused',
        });
        fetchAttendance(selectedSession);
      } catch { /* ignore */ }
      return;
    }

    const newStatus = record.status === 'present' ? 'excused'
      : record.status === 'excused' ? 'absent'
      : 'present';

    try {
      await api.patch(`/attendance/${record.attendance_id}/override/`, { status: newStatus });
      fetchAttendance(selectedSession);
    } catch { /* ignore */ }
  };

  return (
    <div>
      <div className="flex-between mb-2">
        <h3>Attendance Monitoring</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label className="form-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>Session:</label>
          <select className="form-select" style={{ width: 'auto', minWidth: '200px' }}
            value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
            {sessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.date} | {s.start_time} - {s.end_time}
              </option>
            ))}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={() => fetchAttendance(selectedSession)}>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner"></div></div>
      ) : sessions.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <h3>No Sessions Available</h3>
            <p>Schedule a class session first from the Schedule tab.</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Matric Number</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr key={index}>
                    <td><strong>{record.matric_number}</strong></td>
                    <td>{record.full_name}</td>
                    <td>
                      <span className={`badge badge-${record.status}`}>
                        {record.status}
                      </span>
                    </td>
                    <td>{record.timestamp ? new Date(record.timestamp).toLocaleTimeString() : '--'}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleOverride(record)}>
                        Override
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
