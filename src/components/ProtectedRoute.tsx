import { useAuthStore } from '@/lib/auth';
import { Navigate, Outlet } from 'react-router-dom';
export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}