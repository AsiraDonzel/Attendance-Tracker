/**
 * Student Courses Page - shows all enrolled courses.
 */
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Layout from '../../components/Layout';

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/attendance/student/courses/')
      .then(res => setCourses(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="loading-center"><div className="spinner"></div></div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h1>My Courses</h1>
        <p>List of all courses you are currently enrolled in.</p>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state">
          <h3>No Courses Found</h3>
          <p>You have not been enrolled in any courses for this semester.</p>
        </div>
      ) : (
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {courses.map(course => (
            <div key={course.id} className="card slide-up" style={{ padding: '24px', borderTop: '4px solid #2E7D32' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#1a1a2e' }}>{course.code}</h2>
                <span className="badge" style={{ background: '#e8f5e9', color: '#2E7D32' }}>{course.credits} Credits</span>
              </div>
              <h3 style={{ fontSize: '1.1rem', color: '#4a5568', margin: '0 0 16px 0' }}>{course.title}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: '#8896a7' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  {course.department} Department
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  Level {course.level}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
