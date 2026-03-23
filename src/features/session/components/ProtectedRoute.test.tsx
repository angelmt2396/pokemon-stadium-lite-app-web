import { Route, Routes } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from '@/features/session/components/ProtectedRoute';
import { renderWithProviders } from '@/test/test-utils';

const { useSessionMock } = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
}));

vi.mock('@/features/session/context/SessionContext', () => ({
  useSession: useSessionMock,
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useSessionMock.mockReset();
  });

  it('shows the restoring state while the session is being restored', () => {
    useSessionMock.mockReturnValue({ status: 'restoring' });

    renderWithProviders(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>protected content</div>} />
        </Route>
      </Routes>,
    );

    expect(screen.getByText('Restaurando sesión...')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to login', () => {
    useSessionMock.mockReturnValue({ status: 'unauthenticated' });

    renderWithProviders(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>protected content</div>} />
        </Route>
        <Route path="/login" element={<div>login route</div>} />
      </Routes>,
    );

    expect(screen.getByText('login route')).toBeInTheDocument();
  });

  it('renders child routes when the session is authenticated', () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });

    renderWithProviders(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>protected content</div>} />
        </Route>
      </Routes>,
    );

    expect(screen.getByText('protected content')).toBeInTheDocument();
  });
});
