import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from '@/components/layout/AppShell';
import { renderWithProviders } from '@/test/test-utils';

const { useSessionMock } = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
}));

vi.mock('@/features/session/context/SessionContext', () => ({
  useSession: useSessionMock,
}));

describe('AppShell', () => {
  beforeEach(() => {
    useSessionMock.mockReset();
    useSessionMock.mockReturnValue({
      session: {
        sessionToken: 'session-token',
        playerId: 'player-1',
        nickname: 'Ash',
        playerStatus: 'idle',
        currentLobbyId: null,
        currentBattleId: null,
        reconnectToken: null,
      },
      logout: vi.fn(),
      errorMessage: null,
    });
  });

  it('renders the brand, session label, and page content', () => {
    renderWithProviders(
      <AppShell>
        <div>child content</div>
      </AppShell>,
    );

    expect(screen.getAllByText('PokeAlbo')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Sesión activa: Ash')[0]).toBeInTheDocument();
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('calls logout from the navigation action', async () => {
    const logoutMock = vi.fn().mockResolvedValue(undefined);
    useSessionMock.mockReturnValue({
      session: {
        sessionToken: 'session-token',
        playerId: 'player-1',
        nickname: 'Ash',
        playerStatus: 'idle',
        currentLobbyId: null,
        currentBattleId: null,
        reconnectToken: null,
      },
      logout: logoutMock,
      errorMessage: null,
    });

    const user = userEvent.setup();

    renderWithProviders(
      <AppShell>
        <div>child content</div>
      </AppShell>,
    );

    await user.click(screen.getAllByRole('button', { name: 'Salir del juego' })[0]);

    expect(logoutMock).toHaveBeenCalled();
  });

  it('shows the shell error banner when the session context exposes an error', () => {
    useSessionMock.mockReturnValue({
      session: {
        sessionToken: 'session-token',
        playerId: 'player-1',
        nickname: 'Ash',
        playerStatus: 'idle',
        currentLobbyId: null,
        currentBattleId: null,
        reconnectToken: null,
      },
      logout: vi.fn(),
      errorMessage: 'No se pudo cerrar la sesión',
    });

    renderWithProviders(
      <AppShell>
        <div>child content</div>
      </AppShell>,
    );

    expect(screen.getByText('No se pudo cerrar la sesión')).toBeInTheDocument();
  });
});
