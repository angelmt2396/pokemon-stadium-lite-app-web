import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from '@/features/session/context/SessionContext';

export function ProtectedRoute() {
  const { status } = useSession();
  const location = useLocation();

  if (status === 'restoring') {
    return (
      <div className="page-container flex min-h-screen items-center justify-center">
        <div className="panel-surface max-w-md text-center">
          <p className="text-sm text-slate-500">Restaurando sesión...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

