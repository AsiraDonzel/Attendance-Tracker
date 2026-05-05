/**
 * ProtectedRoute - redirects to login if not authenticated.
 * Optionally restricts by role (admin or lecturer).
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireAdmin, requireLecturer, requireStudent }) {
  const { isAuthenticated, isAdmin, isLecturer, isStudent, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/auth/login" replace />;
  }

  if (requireLecturer && !isLecturer && !isAdmin) {
    return <Navigate to="/auth/login" replace />;
  }

  if (requireStudent && !isStudent) {
     return <Navigate to="/student/login" replace />;
  }

  return children;
}
