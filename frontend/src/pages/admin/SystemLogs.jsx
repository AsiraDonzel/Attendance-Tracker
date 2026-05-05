/**
 * Admin: System Logs - filterable log viewer.
 */
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Layout from '../../components/Layout';

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ action: '', date_from: '', date_to: '' });

  const fetchLogs = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.action) params.append('action', filters.action);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    params.append('limit', '100');

    api.get(`/logs/?${params.toString()}`)
      .then(res => setLogs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <Layout>
      <div className="page-header">
        <h1>System Logs</h1>
        <p>View and filter system activity logs</p>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <form onSubmit={handleFilter} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
              <label className="form-label">Action Keyword</label>
              <input className="form-input" placeholder="Search actions..." value={filters.action}
                onChange={e => setFilters(p => ({ ...p, action: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">From Date</label>
              <input type="date" className="form-input" value={filters.date_from}
                onChange={e => setFilters(p => ({ ...p, date_from: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">To Date</label>
              <input type="date" className="form-input" value={filters.date_to}
                onChange={e => setFilters(p => ({ ...p, date_to: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>Filter</button>
            <button type="button" className="btn btn-secondary" style={{ height: '42px' }}
              onClick={() => { setFilters({ action: '', date_from: '', date_to: '' }); fetchLogs(); }}>
              Clear
            </button>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner"></div></div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>No logs found</td></tr>
                ) : logs.map(log => (
                  <tr key={log.id}>
                    <td>{log.id}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>{log.user_email || 'System'}</td>
                    <td>{log.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
