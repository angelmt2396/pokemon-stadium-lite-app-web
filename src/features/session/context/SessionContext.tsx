import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  clearPersistedSession,
  persistSession,
  readPersistedSession,
} from '@/lib/storage/session-storage';
import { closeNicknameSession, createNicknameSession, getCurrentNicknameSession } from '@/features/session/services/session-api';
import type { SessionPayload, SessionSnapshot, SessionStatus } from '@/features/session/types';
import { getSocketClient } from '@/lib/socket/client';

type SessionContextValue = {
  status: SessionStatus;
  session: SessionSnapshot | null;
  errorMessage: string | null;
  login: (nickname: string) => Promise<SessionPayload>;
  logout: () => Promise<void>;
  invalidateSession: (message?: string | null) => void;
  clearSessionError: () => void;
  updateRuntimeSession: (values: Partial<Pick<SessionSnapshot, 'reconnectToken' | 'currentLobbyId' | 'currentBattleId' | 'playerStatus'>>) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function mapSessionSnapshot(
  sessionToken: string,
  payload: {
    playerId: string;
    nickname: string;
    playerStatus: string;
    currentLobbyId: string | null;
    currentBattleId: string | null;
  },
  reconnectToken: string | null,
): SessionSnapshot {
  return {
    sessionToken,
    playerId: payload.playerId,
    nickname: payload.nickname,
    playerStatus: payload.playerStatus,
    currentLobbyId: payload.currentLobbyId,
    currentBattleId: payload.currentBattleId,
    reconnectToken,
  };
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<SessionStatus>('restoring');
  const [session, setSession] = useState<SessionSnapshot | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const releasedSessionTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const persisted = readPersistedSession();

    if (!persisted.sessionToken) {
      setStatus('unauthenticated');
      return;
    }

    void getCurrentNicknameSession(persisted.sessionToken)
      .then((payload) => {
        const nextSession = mapSessionSnapshot(
          persisted.sessionToken as string,
          payload,
          persisted.reconnectToken,
        );

        persistSession({
          sessionToken: persisted.sessionToken,
          playerId: payload.playerId,
          nickname: payload.nickname,
          lobbyId: payload.currentLobbyId,
          battleId: payload.currentBattleId,
        });

        setSession(nextSession);
        setStatus('authenticated');
      })
      .catch(() => {
        clearPersistedSession();
        setSession(null);
        setStatus('unauthenticated');
      });
  }, []);

  const applySessionPayload = useCallback((payload: SessionPayload) => {
    if (!payload.sessionToken) {
      throw new Error('Session token was not returned');
    }

    const nextSession = mapSessionSnapshot(payload.sessionToken, payload, payload.reconnectToken ?? null);

    persistSession({
      sessionToken: payload.sessionToken,
      playerId: payload.playerId,
      nickname: payload.nickname,
      reconnectToken: payload.reconnectToken ?? null,
      lobbyId: payload.currentLobbyId,
      battleId: payload.currentBattleId,
    });

    setSession(nextSession);
    setStatus('authenticated');
  }, []);

  const login = useCallback(async (nickname: string) => {
    setErrorMessage(null);
    const payload = await createNicknameSession({ nickname });
    applySessionPayload(payload);
    return payload;
  }, [applySessionPayload]);

  const logout = useCallback(async () => {
    if (!session) {
      clearPersistedSession();
      setStatus('unauthenticated');
      return;
    }

    setErrorMessage(null);
    await closeNicknameSession(session.sessionToken);

    getSocketClient().disconnect();
    clearPersistedSession();
    setSession(null);
    setStatus('unauthenticated');
  }, [session]);

  const invalidateSession = useCallback((message?: string | null) => {
    getSocketClient().disconnect();
    clearPersistedSession();
    setSession(null);
    setStatus('unauthenticated');
    setErrorMessage(message ?? null);
  }, []);

  const releaseIdleSessionOnPageExit = useCallback(() => {
    if (!session) {
      return;
    }

    const shouldReleaseSession =
      session.playerStatus === 'idle' &&
      session.currentLobbyId === null &&
      session.currentBattleId === null;

    if (!shouldReleaseSession || releasedSessionTokenRef.current === session.sessionToken) {
      return;
    }

    releasedSessionTokenRef.current = session.sessionToken;
    void closeNicknameSession(session.sessionToken, { keepalive: true }).catch(() => undefined);
  }, [session]);

  useEffect(() => {
    releasedSessionTokenRef.current = null;
  }, [session?.sessionToken]);

  useEffect(() => {
    const handlePageHide = (event: PageTransitionEvent) => {
      if (event.persisted) {
        return;
      }

      releaseIdleSessionOnPageExit();
    };

    const handleBeforeUnload = () => {
      releaseIdleSessionOnPageExit();
    };

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [releaseIdleSessionOnPageExit]);

  const clearSessionError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const updateRuntimeSession = useCallback(
    (values: Partial<Pick<SessionSnapshot, 'reconnectToken' | 'currentLobbyId' | 'currentBattleId' | 'playerStatus'>>) => {
      setSession((current) => {
        if (!current) {
          return current;
        }

        const nextSession = {
          ...current,
          ...values,
        };

        persistSession({
          reconnectToken: nextSession.reconnectToken,
          lobbyId: nextSession.currentLobbyId,
          battleId: nextSession.currentBattleId,
        });

        return nextSession;
      });
    },
    [],
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      session,
      errorMessage,
      login: async (nickname: string) => {
        try {
          return await login(nickname);
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : 'Unexpected session error');
          throw error;
        }
      },
      logout: async () => {
        try {
          await logout();
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : 'Unexpected session error');
          throw error;
        }
      },
      invalidateSession,
      clearSessionError,
      updateRuntimeSession,
    }),
    [clearSessionError, errorMessage, invalidateSession, login, logout, session, status, updateRuntimeSession],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }

  return context;
}
