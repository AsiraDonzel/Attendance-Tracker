/**
 * Course Detail Page - Tabbed view for Schedule, Attendance, Reports, Grades.
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import ScheduleTab from './ScheduleTab';
import AttendanceTab from './AttendanceTab';
import ReportsTab from './ReportsTab';
import GradeTab from './GradeTab';

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('schedule');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/courses/${id}/`)
      .then(res => setCourse(res.data))
      .catch(() => navigate('/lecturer/dashboard'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout><div className="loading-center"><div className="spinner"></div></div></Layout>;
  if (!course) return null;

  const tabs = [
    { key: 'schedule', label: 'Schedule Classes' },
    { key: 'attendance', label: 'Attendance Monitoring' },
    { key: 'reports', label: 'Reports & Analytics' },
    { key: 'grades', label: 'Grade Calculation' },
  ];

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/lecturer/dashboard')}
              style={{ marginBottom: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to Dashboard
            </button>
            <h1>{course.code} - {course.title}</h1>
            <p>{course.department} Engineering | {course.level} | {course.credits} credits</p>
          </div>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(tab => (
          <button key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="fade-in">
        {activeTab === 'schedule' && <ScheduleTab courseId={id} course={course} />}
        {activeTab === 'attendance' && <AttendanceTab courseId={id} />}
        {activeTab === 'reports' && <ReportsTab courseId={id} course={course} />}
        {activeTab === 'grades' && <GradeTab courseId={id} course={course} />}
      </div>
    </Layout>
  );
}
