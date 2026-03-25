import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionProvider, useSession } from '@/features/session/context/SessionContext';
import { sessionStorageKeys } from '@/lib/storage/session-storage';
import { renderWithProviders } from '@/test/test-utils';
import type { SessionPayload } from '@/features/session/types';

const {
  createNicknameSessionMock,
  getCurrentNicknameSessionMock,
  closeNicknameSessionMock,
  connectMock,
  offMock,
  onMock,
  disconnectMock,
} = vi.hoisted(() => ({
  createNicknameSessionMock: vi.fn(),
  getCurrentNicknameSessionMock: vi.fn(),
  closeNicknameSessionMock: vi.fn(),
  connectMock: vi.fn(),
  offMock: vi.fn(),
  onMock: vi.fn(),
  disconnectMock: vi.fn(),
}));

vi.mock('@/features/session/services/session-api', () => ({
  createNicknameSession: createNicknameSessionMock,
  getCurrentNicknameSession: getCurrentNicknameSessionMock,
  closeNicknameSession: closeNicknameSessionMock,
}));

vi.mock('@/lib/socket/client', () => ({
  getSocketClient: () => ({
    active: false,
    connected: false,
    auth: undefined,
    connect: connectMock,
    off: offMock,
    on: onMock,
    disconnect: disconnectMock,
  }),
}));

const sessionPayload: SessionPayload = {
  playerId: 'player-1',
  nickname: 'Ash',
  sessionStatus: 'active',
  playerStatus: 'idle',
  currentLobbyId: null,
  currentBattleId: null,
  sessionToken: 'session-token',
  reconnectToken: 'reconnect-token',
};

function SessionConsumer() {
  const { status, session, login, logout, invalidateSession, errorMessage } = useSession();

  return (
    <div>
      <p>status:{status}</p>
      <p>nickname:{session?.nickname ?? 'none'}</p>
      <p>lobby:{session?.currentLobbyId ?? 'none'}</p>
      <p>error:{errorMessage ?? 'none'}</p>
      <button
        type="button"
        onClick={() => {
          void login('Ash');
        }}
      >
        login
      </button>
      <button
        type="button"
        onClick={() => {
          void logout();
        }}
      >
        logout
      </button>
      <button
        type="button"
        onClick={() => {
          invalidateSession('Invalid or expired session token');
        }}
      >
        invalidate
      </button>
    </div>
  );
}

describe('SessionProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    createNicknameSessionMock.mockReset();
    getCurrentNicknameSessionMock.mockReset();
    closeNicknameSessionMock.mockReset();
    connectMock.mockReset();
    offMock.mockReset();
    onMock.mockReset();
    disconnectMock.mockReset();
  });

  it('restores a persisted session token on mount', async () => {
    localStorage.setItem(sessionStorageKeys.sessionToken, 'persisted-token');
    localStorage.setItem(sessionStorageKeys.reconnectToken, 'persisted-reconnect');
    getCurrentNicknameSessionMock.mockResolvedValue({
      ...sessionPayload,
      currentLobbyId: 'lobby-1',
      currentBattleId: 'battle-1',
    });

    renderWithProviders(
      <SessionProvider>
        <SessionConsumer />
      </SessionProvider>,
    );

    expect(await screen.findByText('status:authenticated')).toBeInTheDocument();
    expect(screen.getByText('nickname:Ash')).toBeInTheDocument();
    expect(screen.getByText('lobby:lobby-1')).toBeInTheDocument();
    expect(getCurrentNicknameSessionMock).toHaveBeenCalledWith('persisted-token');
    expect(connectMock).toHaveBeenCalled();
  });

  it('logs in and persists the returned session payload', async () => {
    createNicknameSessionMock.mockResolvedValue(sessionPayload);

    const user = userEvent.setup();

    renderWithProviders(
      <SessionProvider>
        <SessionConsumer />
      </SessionProvider>,
    );

    expect(await screen.findByText('status:unauthenticated')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'login' }));

    expect(createNicknameSessionMock).toHaveBeenCalledWith({ nickname: 'Ash' });
    expect(await screen.findByText('status:authenticated')).toBeInTheDocument();
    expect(localStorage.getItem(sessionStorageKeys.sessionToken)).toBe('session-token');
    expect(localStorage.getItem(sessionStorageKeys.nickname)).toBe('Ash');
  });

  it('logs out, disconnects the socket, and clears persisted session data', async () => {
    localStorage.setItem(sessionStorageKeys.sessionToken, 'persisted-token');
    localStorage.setItem(sessionStorageKeys.nickname, 'Ash');
    getCurrentNicknameSessionMock.mockResolvedValue(sessionPayload);
    closeNicknameSessionMock.mockResolvedValue({ closed: true });

    const user = userEvent.setup();

    renderWithProviders(
      <SessionProvider>
        <SessionConsumer />
      </SessionProvider>,
    );

    expect(await screen.findByText('status:authenticated')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'logout' }));

    await waitFor(() => {
      expect(closeNicknameSessionMock).toHaveBeenCalledWith('persisted-token');
      expect(disconnectMock).toHaveBeenCalled();
      expect(screen.getByText('status:unauthenticated')).toBeInTheDocument();
      expect(localStorage.getItem(sessionStorageKeys.sessionToken)).toBeNull();
    });
  });

  it('invalidates the local session when the token expires', async () => {
    localStorage.setItem(sessionStorageKeys.sessionToken, 'persisted-token');
    localStorage.setItem(sessionStorageKeys.nickname, 'Ash');
    getCurrentNicknameSessionMock.mockResolvedValue(sessionPayload);

    const user = userEvent.setup();

    renderWithProviders(
      <SessionProvider>
        <SessionConsumer />
      </SessionProvider>,
    );

    expect(await screen.findByText('status:authenticated')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'invalidate' }));

    await waitFor(() => {
      expect(disconnectMock).toHaveBeenCalled();
      expect(screen.getByText('status:unauthenticated')).toBeInTheDocument();
      expect(screen.getByText('error:Invalid or expired session token')).toBeInTheDocument();
      expect(localStorage.getItem(sessionStorageKeys.sessionToken)).toBeNull();
    });
  });
});
