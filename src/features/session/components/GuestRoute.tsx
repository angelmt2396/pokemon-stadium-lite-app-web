import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '@/features/session/context/SessionContext';

export function GuestRoute() {
  const { status } = useSession();

  if (status === 'restoring') {
    return (
      <div className="page-container flex min-h-screen items-center justify-center">
        <div className="panel-surface max-w-md text-center">
          <p className="text-sm text-slate-500">Restaurando sesión...</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

