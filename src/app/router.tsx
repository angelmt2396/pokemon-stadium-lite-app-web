import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { GuestRoute } from '@/features/session/components/GuestRoute';
import { ProtectedRoute } from '@/features/session/components/ProtectedRoute';
import { BattlePage } from '@/pages/BattlePage';
import { CatalogPage } from '@/pages/CatalogPage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { MatchmakingPage } from '@/pages/MatchmakingPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/catalog',
        element: <CatalogPage />,
      },
      {
        path: '/matchmaking',
        element: <Navigate to="/battle" replace />,
      },
      {
        path: '/battle',
        element: <BattlePage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
