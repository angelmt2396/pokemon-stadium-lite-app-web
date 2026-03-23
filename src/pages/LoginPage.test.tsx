import { Route, Routes } from 'react-router-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from '@/pages/LoginPage';
import { renderWithProviders } from '@/test/test-utils';

const { useSessionMock } = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
}));

vi.mock('@/features/session/context/SessionContext', () => ({
  useSession: useSessionMock,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    useSessionMock.mockReset();
    useSessionMock.mockReturnValue({
      status: 'unauthenticated',
      session: null,
      errorMessage: null,
      login: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn(),
      clearSessionError: vi.fn(),
      updateRuntimeSession: vi.fn(),
    });
  });

  it('submits the nickname through the session context', async () => {
    const loginMock = vi.fn().mockResolvedValue(undefined);
    const clearSessionErrorMock = vi.fn();
    useSessionMock.mockReturnValue({
      status: 'unauthenticated',
      session: null,
      errorMessage: null,
      login: loginMock,
      logout: vi.fn(),
      clearSessionError: clearSessionErrorMock,
      updateRuntimeSession: vi.fn(),
    });

    const user = userEvent.setup();

    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('Nickname'), 'Ash');
    await user.click(screen.getByRole('button', { name: 'Entrar al juego' }));

    expect(clearSessionErrorMock).toHaveBeenCalled();
    expect(loginMock).toHaveBeenCalledWith('Ash');
  });

  it('renders the session error when login fails', () => {
    useSessionMock.mockReturnValue({
      status: 'unauthenticated',
      session: null,
      errorMessage: 'Nickname ya está en uso',
      login: vi.fn(),
      logout: vi.fn(),
      clearSessionError: vi.fn(),
      updateRuntimeSession: vi.fn(),
    });

    renderWithProviders(<LoginPage />);

    expect(screen.getByText('Nickname ya está en uso')).toBeInTheDocument();
  });

  it('redirects authenticated players with an active battle to the battle route', () => {
    useSessionMock.mockReturnValue({
      status: 'authenticated',
      session: {
        sessionToken: 'session-token',
        playerId: 'player-1',
        nickname: 'Ash',
        playerStatus: 'battling',
        currentLobbyId: 'lobby-1',
        currentBattleId: 'battle-1',
        reconnectToken: 'reconnect-token',
      },
      errorMessage: null,
      login: vi.fn(),
      logout: vi.fn(),
      clearSessionError: vi.fn(),
      updateRuntimeSession: vi.fn(),
    });

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/battle" element={<div>battle route</div>} />
        <Route path="/" element={<div>home route</div>} />
      </Routes>,
      { route: '/login' },
    );

    expect(screen.getByText('battle route')).toBeInTheDocument();
  });
});
