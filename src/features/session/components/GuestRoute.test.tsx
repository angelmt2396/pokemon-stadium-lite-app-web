import { Route, Routes } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GuestRoute } from '@/features/session/components/GuestRoute';
import { renderWithProviders } from '@/test/test-utils';

const { useSessionMock } = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
}));

vi.mock('@/features/session/context/SessionContext', () => ({
  useSession: useSessionMock,
}));

describe('GuestRoute', () => {
  beforeEach(() => {
    useSessionMock.mockReset();
  });

  it('shows the restoring state while the session is being restored', () => {
    useSessionMock.mockReturnValue({ status: 'restoring' });

    renderWithProviders(
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/" element={<div>guest content</div>} />
        </Route>
      </Routes>,
    );

    expect(screen.getByText('Restaurando sesión...')).toBeInTheDocument();
  });

  it('renders guest routes when the session is not restoring', () => {
    useSessionMock.mockReturnValue({ status: 'unauthenticated' });

    renderWithProviders(
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/" element={<div>guest content</div>} />
        </Route>
      </Routes>,
    );

    expect(screen.getByText('guest content')).toBeInTheDocument();
  });
});
