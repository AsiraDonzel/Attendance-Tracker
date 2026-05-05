/**
 * Grade Calculation Tab.
 * Set attendance marks, add components, calculate final grades.
 */
import { useState } from 'react';
import api from '../../api/axios';
import { GRADING_SCALE } from '../../utils/constants';

export default function GradeTab({ courseId, course }) {
  const [attendanceMarks, setAttendanceMarks] = useState(10);
  const [components, setComponents] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [componentScores, setComponentScores] = useState({});

  const addComponent = () => {
    setComponents(prev => [...prev, { name: '', max_marks: 0, id: Date.now() }]);
  };

  const updateComponent = (id, field, value) => {
    setComponents(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeComponent = (id) => {
    setComponents(prev => prev.filter(c => c.id !== id));
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      // Build components with scores
      const payload = {
        attendance_marks: parseInt(attendanceMarks, 10),
        components: components.map(c => ({
          name: c.name,
          max_marks: parseFloat(c.max_marks),
          scores: componentScores[c.id] || {},
        })),
        grading_scale: GRADING_SCALE,
      };

      const res = await api.post(`/attendance/grades/${courseId}/`, payload);
      setResults(res.data);
    } catch (err) {
      alert('Failed to calculate grades.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!results) return;
    let csv = 'Matric Number,Name,Attendance Score,Other Scores,Total,Grade,GP\n';
    results.results.forEach(r => {
      csv += `${r.matric_number},${r.full_name},${r.attendance_score},${r.other_scores},${r.total_score},${r.letter_grade},${r.grade_point}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${course.code}_grades.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div>
      <h3 className="mb-2">Grade Calculation</h3>

      <div className="card mb-3">
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Total Marks for Attendance</label>
              <input type="number" className="form-input" value={attendanceMarks}
                onChange={e => setAttendanceMarks(e.target.value)} />
              <div className="form-hint">
                Score = (attended / total_held) x {attendanceMarks}
              </div>
            </div>
          </div>

          <h4 className="mb-1">Additional Assessment Components</h4>
          {components.map(comp => (
            <div key={comp.id} className="form-row" style={{ alignItems: 'flex-end', marginBottom: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Component Name</label>
                <input className="form-input" placeholder="e.g. Exam, Assignment" value={comp.name}
                  onChange={e => updateComponent(comp.id, 'name', e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Max Marks</label>
                <input type="number" className="form-input" value={comp.max_marks}
                  onChange={e => updateComponent(comp.id, 'max_marks', e.target.value)} />
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => removeComponent(comp.id)}
                style={{ marginBottom: '0', height: '42px' }}>
                Remove
              </button>
            </div>
          ))}

          <div className="btn-group">
            <button className="btn btn-secondary btn-sm" onClick={addComponent}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Component
            </button>
            <button className="btn btn-primary" onClick={handleCalculate} disabled={loading}>
              {loading ? 'Calculating...' : 'Calculate Grades'}
            </button>
          </div>
        </div>
      </div>

      {results && (
        <div className="card fade-in" style={{ padding: 0 }}>
          <div className="card-header">
            <h4>Grade Results - {results.course.code}</h4>
            <button className="btn btn-primary btn-sm" onClick={handleExport}>
              Export CSV
            </button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Matric Number</th>
                  <th>Name</th>
                  <th>Attendance ({attendanceMarks})</th>
                  <th>Other Scores</th>
                  <th>Total</th>
                  <th>Grade</th>
                  <th>GP</th>
                </tr>
              </thead>
              <tbody>
                {results.results.map(r => (
                  <tr key={r.student_id}>
                    <td><strong>{r.matric_number}</strong></td>
                    <td>{r.full_name}</td>
                    <td>{r.attendance_score}</td>
                    <td>{r.other_scores}</td>
                    <td><strong>{r.total_score}</strong></td>
                    <td>
                      <span className={`badge ${
                        r.letter_grade === 'A' || r.letter_grade === 'B' ? 'badge-success'
                        : r.letter_grade === 'C' || r.letter_grade === 'D' ? 'badge-warning'
                        : 'badge-danger'
                      }`}>
                        {r.letter_grade}
                      </span>
                    </td>
                    <td>{r.grade_point}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card mt-3">
        <div className="card-body">
          <h4 className="mb-1">Grading Scale</h4>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Score Range</th><th>Grade</th><th>Grade Point</th></tr>
              </thead>
              <tbody>
                {GRADING_SCALE.map(s => (
                  <tr key={s.grade}>
                    <td>{s.min} - {s.max}</td>
                    <td><strong>{s.grade}</strong></td>
                    <td>{s.gp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
