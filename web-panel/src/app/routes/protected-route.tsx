import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { RoleName } from '../../types/common';
import { useAuth } from '../../features/auth/useAuth';

type ProtectedRouteProps = {
  allowRoles?: RoleName[];
};

export function ProtectedRoute({ allowRoles }: ProtectedRouteProps) {
  const { user, isBootstrapping, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return <div className="p-6 text-sm text-gray-500">Загрузка...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowRoles && allowRoles.length > 0) {
    const role = user.role?.name ?? 'USER';
    if (!allowRoles.includes(role)) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}
