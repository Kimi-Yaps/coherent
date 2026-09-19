import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { type UserRole } from '../services/authService';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  redirectPath?: string;
}

const ProtectedRoute = ({
  children,
  allowedRoles,
  redirectPath = '/auth',
}: ProtectedRouteProps) => {
  const { profile, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
        Verifying security credentials...
      </div>
    );
  }

  // If role requirement is specified and role does not match
  if (allowedRoles && !allowedRoles.includes(role)) {
    if (allowedRoles.includes('clinician_admin')) {
      // Special redirect for admin portal
      return <Navigate to="/admin-portal" state={{ from: location }} replace />;
    }
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // If user must be logged in for general protected routes
  if (!profile) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
