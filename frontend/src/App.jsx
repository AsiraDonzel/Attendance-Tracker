/**
 * Main application component with routing.
 * Root URL (/) always redirects to /auth/login.
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

// Student pages
import AttendancePage from './pages/student/AttendancePage';
import StudentLoginPage from './pages/student/StudentLoginPage';
import StudentDashboard from './pages/student/StudentDashboard';
import HistoryPage from './pages/student/HistoryPage';
import StudentCoursesPage from './pages/student/StudentCoursesPage';
import StudentProfilePage from './pages/student/StudentProfilePage';

// Lecturer pages (protected)
import DashboardPage from './pages/lecturer/DashboardPage';
import CourseDetailPage from './pages/lecturer/CourseDetailPage';
import LecturerProfilePage from './pages/lecturer/LecturerProfilePage';

// Admin pages (protected)
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageCourses from './pages/admin/ManageCourses';
import ManageLecturers from './pages/admin/ManageLecturers';
import ManageStudents from './pages/admin/ManageStudents';
import SystemLogs from './pages/admin/SystemLogs';

// Static pages
import ContactPage from './pages/static/ContactPage';
import FAQPage from './pages/static/FAQPage';
import PrivacyPage from './pages/static/PrivacyPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Root redirect to login */}
          <Route path="/" element={<Navigate to="/auth/login" replace />} />

          {/* Auth routes */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />

          {/* Student portal */}
          <Route path="/student/login" element={<StudentLoginPage />} />
          <Route path="/student/attendance" element={<AttendancePage />} />
          <Route path="/student/dashboard" element={
            <ProtectedRoute requireStudent>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/student/history" element={
            <ProtectedRoute requireStudent>
              <HistoryPage />
            </ProtectedRoute>
          } />
          <Route path="/student/courses" element={
            <ProtectedRoute requireStudent>
              <StudentCoursesPage />
            </ProtectedRoute>
          } />
          <Route path="/student/profile" element={
            <ProtectedRoute requireStudent>
              <StudentProfilePage />
            </ProtectedRoute>
          } />

          {/* Lecturer routes (protected) */}
          <Route path="/lecturer/dashboard" element={
            <ProtectedRoute requireLecturer>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/lecturer/course/:id" element={
            <ProtectedRoute requireLecturer>
              <CourseDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/lecturer/profile" element={
            <ProtectedRoute requireLecturer>
              <LecturerProfilePage />
            </ProtectedRoute>
          } />

          {/* Admin routes (protected) */}
          <Route path="/admin-portal" element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin-portal/courses" element={
            <ProtectedRoute requireAdmin>
              <ManageCourses />
            </ProtectedRoute>
          } />
          <Route path="/admin-portal/lecturers" element={
            <ProtectedRoute requireAdmin>
              <ManageLecturers />
            </ProtectedRoute>
          } />
          <Route path="/admin-portal/students" element={
            <ProtectedRoute requireAdmin>
              <ManageStudents />
            </ProtectedRoute>
          } />
          <Route path="/admin-portal/logs" element={
            <ProtectedRoute requireAdmin>
              <SystemLogs />
            </ProtectedRoute>
          } />

          {/* Static pages (public) */}
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/auth/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
