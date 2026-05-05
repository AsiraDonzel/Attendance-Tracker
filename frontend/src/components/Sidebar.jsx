/**
 * Sidebar navigation for lecturer and admin dashboards.
 */
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* SVG icon components */
const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const BookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ClipboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

const LogIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const FingerprintIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" />
    <path d="M5 19.5C5.5 18 6 15 6 12c0-3.5 2.5-6 6-6 3 0 5.5 2 6 5" />
    <path d="M12 12v8c0 2 1 3 2 4" />
    <path d="M8 15c0 2.5.5 5 1 7" />
  </svg>
);

export default function Sidebar() {
  const { user, logout, isAdmin, isLecturer, isStudent } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const getUserInitials = () => {
    if (isAdmin) return 'AD';
    if (isLecturer && user?.lecturer_profile) {
      const { first_name, last_name } = user.lecturer_profile;
      return `${first_name?.[0] || ''}${last_name?.[0] || ''}`.toUpperCase();
    }
    if (isStudent && user?.student_profile) {
      return user.student_profile.full_name?.[0]?.toUpperCase() || 'S';
    }
    return 'U';
  };

  const getUserName = () => {
    if (isAdmin) return 'System Admin';
    if (isLecturer && user?.lecturer_profile) {
      return `${user.lecturer_profile.title} ${user.lecturer_profile.last_name}`;
    }
    if (isStudent && user?.student_profile) {
      return user.student_profile.full_name;
    }
    return user?.email || 'User';
  };

  const getRoleName = () => {
    if (isAdmin) return 'Administrator';
    if (isLecturer) return 'Lecturer';
    if (isStudent) return 'Student';
    return 'User';
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <FingerprintIcon />
          </div>
          <div>
            <div className="sidebar-logo-text">AttendTrack</div>
            <div className="sidebar-logo-sub">Attendance System</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {isStudent && (
          <>
            <div className="sidebar-section-title">Student Portal</div>
            <NavLink to="/student/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <DashboardIcon /> Dashboard
            </NavLink>
            <NavLink to="/student/courses" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <BookIcon /> My Courses
            </NavLink>
            <NavLink to="/student/history" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <ClipboardIcon /> Attendance History
            </NavLink>
            <NavLink to="/student/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <UsersIcon /> Profile
            </NavLink>
          </>
        )}

        {isLecturer && !isAdmin && (
          <>
            <div className="sidebar-section-title">Lecturer Portal</div>
            <NavLink to="/lecturer/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <DashboardIcon /> Dashboard
            </NavLink>
            <NavLink to="/lecturer/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <UsersIcon /> Profile
            </NavLink>
          </>
        )}

        {isAdmin && (
          <>
            <div className="sidebar-section-title">Admin</div>
            <NavLink to="/admin-portal" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <DashboardIcon /> Dashboard
            </NavLink>
            <NavLink to="/admin-portal/courses" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <BookIcon /> Manage Courses
            </NavLink>
            <NavLink to="/admin-portal/lecturers" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <UsersIcon /> Manage Lecturers
            </NavLink>
            <NavLink to="/admin-portal/students" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <ClipboardIcon /> Manage Students
            </NavLink>
            <NavLink to="/admin-portal/logs" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <LogIcon /> System Logs
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{getUserInitials()}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{getUserName()}</div>
            <div className="sidebar-user-role">{getRoleName()}</div>
          </div>
        </div>
        <button className="sidebar-signout" onClick={handleLogout}>
          <LogoutIcon /> Sign Out
        </button>
      </div>
    </aside>
  );
}
