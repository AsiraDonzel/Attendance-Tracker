/**
 * Lecturer Dashboard - shows assigned courses with quick stats.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';

export default function DashboardPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/courses/my-courses/')
      .then(res => setCourses(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalStudents = courses.reduce((sum, c) => sum + (c.student_count || 0), 0);

  return (
    <Layout>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.lecturer_profile?.title} {user?.lecturer_profile?.last_name}</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div className="stat-info">
            <h4>Assigned Courses</h4>
            <div className="stat-value">{courses.length}</div>
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
            <h4>Total Students</h4>
            <div className="stat-value">{totalStudents}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="stat-info">
            <h4>This Semester</h4>
            <div className="stat-value">--</div>
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
            <div className="stat-value">--%</div>
          </div>
        </div>
      </div>

      <div className="page-header-actions" style={{ marginBottom: '20px' }}>
        <h2>My Courses</h2>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner"></div></div>
      ) : courses.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <h3>No Courses Assigned</h3>
            <p>You have not been assigned any courses yet. Contact your administrator.</p>
          </div>
        </div>
      ) : (
        <div className="course-grid">
          {courses.map(course => (
            <div key={course.id} className="course-card" onClick={() => navigate(`/lecturer/course/${course.id}`)}>
              <div className="course-card-code">{course.code}</div>
              <div className="course-card-title">{course.title}</div>
              <div className="course-card-meta">
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  </svg>
                  {course.student_count} students
                </span>
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
                  </svg>
                  {course.level}
                </span>
                <span>{course.department}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
