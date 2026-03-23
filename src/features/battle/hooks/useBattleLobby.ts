import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Socket } from 'socket.io-client';
import { useSession } from '@/features/session/context/SessionContext';
import { getCurrentNicknameSession } from '@/features/session/services/session-api';
import type {
  AttackAckData,
  BattleEndEvent,
  BattleStateEvent,
  BattleLobbyFlowState,
  BattleLobbyPlayer,
  CancelSearchAckData,
  LobbyStatusEvent,
  MatchFoundEvent,
  ReconnectPlayerAckData,
  SearchMatchAckData,
  SearchStatusEvent,
  SocketConnectionState,
  TurnResultEvent,
} from '@/features/battle/types';
import { getSocketClient } from '@/lib/socket/client';
import { socketEvents } from '@/lib/socket/events';
import type { SocketAck } from '@/lib/socket/types';

const MAX_ACTIVITY_ITEMS = 6;
const SOCKET_ACK_TIMEOUT_MS = 5000;
const MATCH_SEARCH_TIMEOUT_MS = 3 * 60_000;

type ActivityItem = {
  id: number;
  message: string;
};

async function ensureSocketConnected(socket: Socket, sessionToken: string) {
  socket.auth = { sessionToken };

  if (socket.connected) {
    return socket;
  }

  await new Promise<void>((resolve, reject) => {
    const handleConnect = () => {
      cleanup();
      resolve();
    };

    const handleError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const cleanup = () => {
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleError);
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleError);
    socket.connect();
  });

  return socket;
}

async function emitWithAck<TData, TPayload extends Record<string, unknown> = Record<string, unknown>>(
  socket: Socket,
  event: string,
  payload: TPayload,
): Promise<SocketAck<TData>> {
  return await new Promise<SocketAck<TData>>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error('socket_ack_timeout'));
    }, SOCKET_ACK_TIMEOUT_MS);

    socket.emit(event, payload, (response: SocketAck<TData>) => {
      window.clearTimeout(timeoutId);
      resolve(response);
    });
  });
}

function findOwnPlayer(players: BattleLobbyPlayer[], playerId: string) {
  return players.find((player) => player.playerId === playerId) ?? null;
}

function findOpponent(players: BattleLobbyPlayer[], playerId: string) {
  return players.find((player) => player.playerId !== playerId) ?? null;
}

export function useBattleLobby() {
  const { t } = useTranslation('battle');
  const { session, updateRuntimeSession } = useSession();
  const [connectionState, setConnectionState] = useState<SocketConnectionState>('disconnected');
  const [searchState, setSearchState] = useState<'idle' | 'searching'>('idle');
  const [lobbyStatus, setLobbyStatus] = useState<LobbyStatusEvent | null>(null);
  const [matchFound, setMatchFound] = useState<MatchFoundEvent | null>(null);
  const [battleState, setBattleState] = useState<BattleStateEvent | null>(null);
  const [battleResult, setBattleResult] = useState<BattleEndEvent | null>(null);
  const [latestTurnResult, setLatestTurnResult] = useState<TurnResultEvent | null>(null);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchStartedAt, setSearchStartedAt] = useState<number | null>(null);
  const [searchElapsedMs, setSearchElapsedMs] = useState<number | null>(null);
  const autoAssignLobbyIdRef = useRef<string | null>(null);
  const autoReadyLobbyIdRef = useRef<string | null>(null);
  const reconnectInFlightRef = useRef(false);
  const sessionRef = useRef(session);

  const appendActivity = useCallback((message: string) => {
    setActivityItems((current) => [{ id: Date.now() + Math.random(), message }, ...current].slice(0, MAX_ACTIVITY_ITEMS));
  }, []);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (!session) {
      setSearchState('idle');
      setSearchStartedAt(null);
      setSearchElapsedMs(null);
      return;
    }

    // Do not trust a restored session status to block the primary CTA until the
    // realtime channel confirms the player is actually searching or waiting.
    if (!session.currentBattleId && !session.currentLobbyId) {
      setSearchState('idle');
      setSearchStartedAt(null);
      setSearchElapsedMs(null);
    }
  }, [session?.currentBattleId, session?.currentLobbyId, session?.playerId]);

  useEffect(() => {
    if (!session?.currentLobbyId) {
      autoAssignLobbyIdRef.current = null;
      autoReadyLobbyIdRef.current = null;
      return;
    }

    if (autoAssignLobbyIdRef.current && autoAssignLobbyIdRef.current !== session.currentLobbyId) {
      autoAssignLobbyIdRef.current = null;
    }

    if (autoReadyLobbyIdRef.current && autoReadyLobbyIdRef.current !== session.currentLobbyId) {
      autoReadyLobbyIdRef.current = null;
    }
  }, [session?.currentLobbyId]);

  const rehydrateRealtimeState = useCallback(async () => {
    const currentSession = sessionRef.current;

    if (
      !currentSession?.sessionToken ||
      !currentSession.reconnectToken ||
      (!currentSession.currentLobbyId && !currentSession.currentBattleId) ||
      reconnectInFlightRef.current
    ) {
      return;
    }

    reconnectInFlightRef.current = true;

    try {
      const socket = await ensureSocketConnected(getSocketClient(currentSession.sessionToken), currentSession.sessionToken);
      const ack = await emitWithAck<ReconnectPlayerAckData>(socket, socketEvents.client.reconnectPlayer, {
        reconnectToken: currentSession.reconnectToken,
      });

      if (!ack.ok) {
        throw new Error(ack.message);
      }

      setLobbyStatus(ack.data.lobbyStatus);

      if (ack.data.lobbyStatus.players.length === 2) {
        setMatchFound({
          lobbyId: ack.data.lobbyId,
          players: ack.data.lobbyStatus.players,
        });
      }

      if (ack.data.battleState) {
        setBattleState(ack.data.battleState);
        setBattleResult(ack.data.battleEnd ?? null);
        setSearchState('idle');
        setSearchStartedAt(null);
        setSearchElapsedMs(null);
        updateRuntimeSession({
          currentLobbyId: ack.data.lobbyId,
          currentBattleId: ack.data.battleState.battleId,
          playerStatus: ack.data.battleState.status,
        });
      } else if (ack.data.battleEnd) {
        setBattleState(null);
        setBattleResult(ack.data.battleEnd);
        setSearchState('idle');
        setSearchStartedAt(null);
        setSearchElapsedMs(null);
        updateRuntimeSession({
          currentLobbyId: null,
          currentBattleId: null,
          playerStatus: 'idle',
        });
      } else {
        setBattleState(null);
        setBattleResult(null);
        const isSearching = ack.data.lobbyStatus.players.length === 1;
        setSearchState(isSearching ? 'searching' : 'idle');
        setSearchStartedAt((current) => (isSearching ? current ?? Date.now() : null));
        setSearchElapsedMs((current) => (isSearching ? current ?? 0 : null));
        updateRuntimeSession({
          currentLobbyId: ack.data.lobbyId,
          currentBattleId: null,
          playerStatus: ack.data.lobbyStatus.status,
        });
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : t('errors.unexpected'));
    } finally {
      reconnectInFlightRef.current = false;
    }
  }, [
    t,
    updateRuntimeSession,
  ]);

  const reconcileSessionState = useCallback(async () => {
    const currentSession = sessionRef.current;

    if (!currentSession?.sessionToken) {
      return;
    }

    try {
      const payload = await getCurrentNicknameSession(currentSession.sessionToken);

      updateRuntimeSession({
        currentLobbyId: payload.currentLobbyId,
        currentBattleId: payload.currentBattleId,
        playerStatus: payload.playerStatus,
      });

      if (payload.currentLobbyId || payload.currentBattleId) {
        void rehydrateRealtimeState();
        return;
      }

      setSearchState('idle');
      setSearchStartedAt(null);
      setSearchElapsedMs(null);
      setLobbyStatus(null);
      setMatchFound(null);
      setBattleState(null);
      setBattleResult(null);
      setLatestTurnResult(null);
    } catch {
      // Ignore reconciliation failures and leave the current UI state intact.
    }
  }, [rehydrateRealtimeState, updateRuntimeSession]);

  useEffect(() => {
    if (!session?.sessionToken) {
      return;
    }

    const socket = getSocketClient(session.sessionToken);
    socket.auth = { sessionToken: session.sessionToken };

    const handleConnect = () => {
      setConnectionState('connected');
      appendActivity(t('log.connected'));
      void rehydrateRealtimeState();
    };

    const handleDisconnect = () => {
      setConnectionState('disconnected');
    };

    const handleConnectError = (error: Error) => {
      setConnectionState('disconnected');
      setActionError(error.message);
    };

    const handleSearchStatus = (payload: SearchStatusEvent) => {
      const currentSession = sessionRef.current;

      if (!currentSession || payload.playerId !== currentSession.playerId) {
        return;
      }

      if (payload.status === 'searching') {
        setSearchState('searching');
        setSearchStartedAt((current) => current ?? Date.now());
        setSearchElapsedMs((current) => current ?? 0);
        updateRuntimeSession({
          currentLobbyId: payload.lobbyId ?? currentSession.currentLobbyId,
          currentBattleId: null,
          playerStatus: 'searching',
        });
        appendActivity(t('log.searching'));
        return;
      }

      setSearchState('idle');
      setSearchStartedAt(null);
      setSearchElapsedMs(null);

      if (payload.canceled) {
        setMatchFound(null);
        setLobbyStatus(null);
        setBattleState(null);
        setBattleResult(null);
        setLatestTurnResult(null);
        updateRuntimeSession({
          reconnectToken: null,
          currentLobbyId: null,
          currentBattleId: null,
          playerStatus: 'idle',
        });
        appendActivity(t('log.cancelled'));
      }
    };

    const handleMatchFound = (payload: MatchFoundEvent) => {
      const currentSession = sessionRef.current;

      if (!currentSession || !payload.players.some((player) => player.playerId === currentSession.playerId)) {
        return;
      }

      setMatchFound(payload);
      setLobbyStatus((current) => {
        if (current && current.lobbyId === payload.lobbyId && current.players.length >= payload.players.length) {
          return current;
        }

        return {
          lobbyId: payload.lobbyId,
          status: 'waiting',
          players: payload.players,
        };
      });
      setSearchState('idle');
      setSearchStartedAt(null);
      setSearchElapsedMs(null);
      setBattleState(null);
      setBattleResult(null);
      setLatestTurnResult(null);
      updateRuntimeSession({
        currentLobbyId: payload.lobbyId,
        currentBattleId: null,
        playerStatus: 'waiting',
      });

      const nextOpponent = findOpponent(payload.players, currentSession.playerId);
      appendActivity(
        nextOpponent ? t('log.matchFound', { nickname: nextOpponent.nickname }) : t('log.matchFoundFallback'),
      );
    };

    const handleLobbyStatus = (payload: LobbyStatusEvent) => {
      const currentSession = sessionRef.current;

      if (!currentSession) {
        return;
      }

      const belongsToCurrentLobby = payload.lobbyId === currentSession.currentLobbyId;
      const includesCurrentPlayer = payload.players.some((player) => player.playerId === currentSession.playerId);

      if (!belongsToCurrentLobby && !includesCurrentPlayer) {
        return;
      }

      setLobbyStatus(payload);

      const currentPlayer = payload.players.find((player) => player.playerId === currentSession.playerId);

      if (currentPlayer?.team.length === 3 || currentPlayer?.ready) {
        setActionError(null);
      }

      if (payload.status === 'finished' && payload.players.length === 0) {
        setSearchState('idle');
        setSearchStartedAt(null);
        setSearchElapsedMs(null);
        setMatchFound(null);
        setBattleState(null);
        setBattleResult(null);
        setLatestTurnResult(null);
        updateRuntimeSession({
          reconnectToken: null,
          currentLobbyId: null,
          currentBattleId: null,
          playerStatus: 'idle',
        });
        return;
      }

      if (payload.status === 'waiting' && payload.players.length === 1) {
        setSearchState('searching');
        setSearchStartedAt((current) => current ?? Date.now());
        setSearchElapsedMs((current) => current ?? 0);
      } else {
        setSearchState('idle');
        setSearchStartedAt(null);
        setSearchElapsedMs(null);
      }

      updateRuntimeSession({
        currentLobbyId: payload.lobbyId,
        playerStatus: payload.status,
      });

      if (payload.players.length === 2) {
        setMatchFound({
          lobbyId: payload.lobbyId,
          players: payload.players,
        });
      }

      appendActivity(t('log.lobbyUpdated'));
    };

    const handleBattleStart = (payload: BattleStateEvent) => {
      const currentSession = sessionRef.current;

      if (!currentSession || payload.lobbyId !== currentSession.currentLobbyId) {
        return;
      }

      setBattleState(payload);
      setBattleResult(null);
      setLatestTurnResult(null);
      setSearchState('idle');
      setSearchStartedAt(null);
      setSearchElapsedMs(null);
      updateRuntimeSession({
        currentLobbyId: payload.lobbyId,
        currentBattleId: payload.battleId,
        playerStatus: payload.status,
      });
      appendActivity(t('log.battleStarted'));
    };

    const handleBattlePause = (payload: BattleStateEvent) => {
      const currentSession = sessionRef.current;

      if (!currentSession || payload.battleId !== currentSession.currentBattleId) {
        return;
      }

      setBattleState(payload);
      setActionError(null);
      setLatestTurnResult(null);
      updateRuntimeSession({
        currentLobbyId: payload.lobbyId,
        currentBattleId: payload.battleId,
        playerStatus: payload.status,
      });
      appendActivity(
        payload.disconnectedPlayerId === currentSession.playerId ? t('log.pauseSelf') : t('log.pauseOpponent'),
      );
    };

    const handleBattleResume = (payload: BattleStateEvent) => {
      const currentSession = sessionRef.current;

      if (!currentSession || payload.battleId !== currentSession.currentBattleId) {
        return;
      }

      setBattleState(payload);
      setActionError(null);
      setLatestTurnResult(null);
      updateRuntimeSession({
        currentLobbyId: payload.lobbyId,
        currentBattleId: payload.battleId,
        playerStatus: payload.status,
      });
      appendActivity(t('log.battleResumed'));
    };

    const handleTurnResult = (payload: TurnResultEvent) => {
      const currentSession = sessionRef.current;

      if (!currentSession || payload.battleId !== currentSession.currentBattleId) {
        return;
      }

      setBattleState((current) => {
        if (!current || current.battleId !== payload.battleId) {
          return current;
        }

        return {
          ...current,
          status: payload.battleStatus,
          currentTurnPlayerId: payload.nextTurnPlayerId,
          finishReason: null,
          disconnectedPlayerId: null,
          reconnectDeadlineAt: null,
          players: current.players.map((player) => {
            if (player.playerId !== payload.defenderPlayerId) {
              return player;
            }

            if (payload.autoSwitchedPokemon && payload.autoSwitchedPokemon.playerId === player.playerId) {
              return {
                ...player,
                activePokemonIndex: payload.autoSwitchedPokemon.activePokemonIndex,
                activePokemon: payload.autoSwitchedPokemon.pokemon,
              };
            }

            return {
              ...player,
              activePokemon:
                player.activePokemon && player.activePokemon.pokemonId === payload.defenderPokemonId
                  ? {
                      ...player.activePokemon,
                      currentHp: payload.defenderRemainingHp,
                      defeated: payload.defenderDefeated,
                    }
                  : player.activePokemon,
            };
          }),
        };
      });
      setLatestTurnResult(payload);

      appendActivity(t('log.turnResolved'));
    };

    const handleBattleEnd = (payload: BattleEndEvent) => {
      const currentSession = sessionRef.current;

      if (!currentSession) {
        return;
      }

      const isCurrentBattle =
        currentSession.currentBattleId === payload.battleId || battleState?.battleId === payload.battleId;

      if (!isCurrentBattle) {
        return;
      }

      setBattleResult(payload);
      setBattleState((current) =>
        current && current.battleId === payload.battleId
          ? {
              ...current,
              status: 'finished',
              currentTurnPlayerId: null,
              winnerPlayerId: payload.winnerPlayerId,
              finishReason: payload.reason,
              disconnectedPlayerId: payload.disconnectedPlayerId,
              reconnectDeadlineAt: null,
            }
          : current,
      );
      setSearchState('idle');
      setSearchStartedAt(null);
      setSearchElapsedMs(null);
      setLobbyStatus(null);
      setMatchFound(null);
      setLatestTurnResult(null);
      updateRuntimeSession({
        currentLobbyId: null,
        currentBattleId: null,
        playerStatus: 'idle',
      });
      appendActivity(
        payload.reason === 'disconnect_timeout'
          ? payload.winnerPlayerId === currentSession.playerId
            ? t('log.battleWonByDisconnect')
            : t('log.battleLostByDisconnect')
          : payload.winnerPlayerId === currentSession.playerId
            ? t('log.battleWon')
            : t('log.battleLost'),
      );
    };

    setConnectionState(socket.connected ? 'connected' : socket.active ? 'connecting' : 'disconnected');

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on(socketEvents.server.searchStatus, handleSearchStatus);
    socket.on(socketEvents.server.matchFound, handleMatchFound);
    socket.on(socketEvents.server.lobbyStatus, handleLobbyStatus);
    socket.on(socketEvents.server.battleStart, handleBattleStart);
    socket.on(socketEvents.server.battlePause, handleBattlePause);
    socket.on(socketEvents.server.battleResume, handleBattleResume);
    socket.on(socketEvents.server.turnResult, handleTurnResult);
    socket.on(socketEvents.server.battleEnd, handleBattleEnd);

    if (!socket.connected && !socket.active) {
      setConnectionState('connecting');
      socket.connect();
    }

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        void rehydrateRealtimeState();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('pageshow', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off(socketEvents.server.searchStatus, handleSearchStatus);
      socket.off(socketEvents.server.matchFound, handleMatchFound);
      socket.off(socketEvents.server.lobbyStatus, handleLobbyStatus);
      socket.off(socketEvents.server.battleStart, handleBattleStart);
      socket.off(socketEvents.server.battlePause, handleBattlePause);
      socket.off(socketEvents.server.battleResume, handleBattleResume);
      socket.off(socketEvents.server.turnResult, handleTurnResult);
      socket.off(socketEvents.server.battleEnd, handleBattleEnd);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('pageshow', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [
    appendActivity,
    reconcileSessionState,
    rehydrateRealtimeState,
    session?.sessionToken,
    t,
    updateRuntimeSession,
  ]);

  useEffect(() => {
    if (!session?.reconnectToken || (!session.currentLobbyId && !session.currentBattleId)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void rehydrateRealtimeState();
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    rehydrateRealtimeState,
    session?.currentBattleId,
    session?.currentLobbyId,
    session?.reconnectToken,
  ]);

  useEffect(() => {
    if (!session?.sessionToken) {
      return;
    }

    const shouldPoll =
      searchState === 'searching' ||
      Boolean(session.currentLobbyId) ||
      Boolean(session.currentBattleId);

    if (!shouldPoll) {
      return;
    }

    let cancelled = false;

    const syncFromSession = async () => {
      try {
        const payload = await getCurrentNicknameSession(session.sessionToken);

        if (cancelled) {
          return;
        }

        updateRuntimeSession({
          currentLobbyId: payload.currentLobbyId,
          currentBattleId: payload.currentBattleId,
          playerStatus: payload.playerStatus,
        });

        if (payload.currentLobbyId || payload.currentBattleId) {
          void rehydrateRealtimeState();
        } else if (searchState !== 'searching') {
          setLobbyStatus(null);
          setMatchFound(null);
          setBattleState(null);
          setBattleResult(null);
          setLatestTurnResult(null);
        }
      } catch {
        // Ignore polling errors. Realtime flow remains the primary source.
      }
    };

    void syncFromSession();

    const intervalId = window.setInterval(() => {
      void syncFromSession();
    }, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [
    rehydrateRealtimeState,
    searchState,
    session?.currentBattleId,
    session?.currentLobbyId,
    session?.sessionToken,
    updateRuntimeSession,
  ]);

  const searchMatch = useCallback(async () => {
    if (!session?.sessionToken) {
      return;
    }

    setActionPending(true);
    setActionError(null);
    setSearchState('searching');
    setSearchStartedAt(Date.now());
    setSearchElapsedMs(0);
    setBattleState(null);
    setBattleResult(null);
    setMatchFound(null);
    setLatestTurnResult(null);
    appendActivity(t('log.searchRequestSent'));

    try {
      const socket = await ensureSocketConnected(getSocketClient(session.sessionToken), session.sessionToken);
      const ack = await emitWithAck<SearchMatchAckData>(socket, socketEvents.client.searchMatch, {});

      if (!ack.ok) {
        throw new Error(ack.message);
      }

      setLobbyStatus(ack.data.lobbyStatus);
      setMatchFound(null);
      setBattleState(null);
      setBattleResult(null);
      setLatestTurnResult(null);
      updateRuntimeSession({
        reconnectToken: ack.data.reconnectToken,
        currentLobbyId: ack.data.lobbyId,
        currentBattleId: null,
        playerStatus: 'searching',
      });
      appendActivity(t('log.searching'));
    } catch (error) {
      setSearchState('idle');
      setSearchStartedAt(null);
      setSearchElapsedMs(null);

      if (error instanceof Error && error.message === 'Player already has an active lobby or battle') {
        void reconcileSessionState();
      }

      setActionError(
        error instanceof Error && error.message === 'socket_ack_timeout'
          ? t('errors.socketTimeout')
          : error instanceof Error
            ? error.message
            : t('errors.unexpected'),
      );
    } finally {
      setActionPending(false);
    }
  }, [appendActivity, reconcileSessionState, session?.sessionToken, t, updateRuntimeSession]);

  const assignTeam = useCallback(async () => {
    if (!session?.sessionToken || !session.currentLobbyId) {
      return false;
    }

    setActionError(null);
    appendActivity(t('log.teamAssignRequestSent'));

    try {
      const socket = await ensureSocketConnected(getSocketClient(session.sessionToken), session.sessionToken);
      socket.emit(socketEvents.client.assignPokemon, {
        lobbyId: session.currentLobbyId,
      });
      return true;
    } catch (error) {
      setActionError(
        error instanceof Error && error.message === 'socket_ack_timeout'
          ? t('errors.socketTimeout')
          : error instanceof Error
            ? error.message
            : t('errors.unexpected'),
      );
      return false;
    }
  }, [appendActivity, session?.currentLobbyId, session?.sessionToken, t]);

  const dismissBattleResult = useCallback(() => {
    setBattleResult(null);
    setBattleState(null);
    setLobbyStatus(null);
    setMatchFound(null);
    setLatestTurnResult(null);
    setActionError(null);
  }, []);

  const markReady = useCallback(async () => {
    if (!session?.sessionToken || !session.currentLobbyId) {
      return false;
    }

    setActionError(null);
    appendActivity(t('log.readyRequestSent'));

    try {
      const socket = await ensureSocketConnected(getSocketClient(session.sessionToken), session.sessionToken);
      socket.emit(socketEvents.client.ready, {
        lobbyId: session.currentLobbyId,
      });
      return true;
    } catch (error) {
      setActionError(
        error instanceof Error && error.message === 'socket_ack_timeout'
          ? t('errors.socketTimeout')
          : error instanceof Error
            ? error.message
            : t('errors.unexpected'),
      );
      return false;
    }
  }, [appendActivity, session?.currentLobbyId, session?.sessionToken, t]);

  const attack = useCallback(async () => {
    if (!session?.sessionToken || !battleState?.battleId) {
      return;
    }

    setActionPending(true);
    setActionError(null);
    appendActivity(t('log.attackRequestSent'));

    try {
      const socket = await ensureSocketConnected(getSocketClient(session.sessionToken), session.sessionToken);
      const ack = await emitWithAck<AttackAckData>(socket, socketEvents.client.attack, {
        battleId: battleState.battleId,
      });

      if (!ack.ok) {
        throw new Error(ack.message);
      }
    } catch (error) {
      setActionError(
        error instanceof Error && error.message === 'socket_ack_timeout'
          ? t('errors.socketTimeout')
          : error instanceof Error
            ? error.message
            : t('errors.unexpected'),
      );
    } finally {
      setActionPending(false);
    }
  }, [appendActivity, battleState?.battleId, session?.sessionToken, t]);

  const stopSearch = useCallback(async (reason: 'manual' | 'timeout') => {
    if (!session?.sessionToken) {
      return false;
    }

    setActionPending(true);
    if (reason === 'manual') {
      setActionError(null);
      appendActivity(t('log.cancelRequestSent'));
    }

    try {
      const socket = await ensureSocketConnected(getSocketClient(session.sessionToken), session.sessionToken);
      const ack = await emitWithAck<CancelSearchAckData>(socket, socketEvents.client.cancelSearch, {});

      if (!ack.ok) {
        throw new Error(ack.message);
      }

      setSearchState('idle');
      setSearchStartedAt(null);
      setSearchElapsedMs(null);
      setMatchFound(null);
      setLobbyStatus(ack.data.lobbyStatus);
      setBattleState(null);
      setBattleResult(null);
      setLatestTurnResult(null);
      updateRuntimeSession({
        reconnectToken: null,
        currentLobbyId: null,
        currentBattleId: null,
        playerStatus: 'idle',
      });
      if (reason === 'timeout') {
        setActionError(t('errors.searchTimeout'));
        appendActivity(t('log.searchTimedOut'));
      } else {
        appendActivity(t('log.cancelled'));
      }
      return true;
    } catch (error) {
      setSearchStartedAt(null);
      setSearchElapsedMs(null);
      setActionError(
        error instanceof Error && error.message === 'socket_ack_timeout'
          ? t('errors.socketTimeout')
          : error instanceof Error
            ? error.message
            : t('errors.unexpected'),
      );
      return false;
    } finally {
      setActionPending(false);
    }
  }, [appendActivity, session?.sessionToken, t, updateRuntimeSession]);

  const cancelSearch = useCallback(async () => {
    return await stopSearch('manual');
  }, [stopSearch]);

  const players =
    lobbyStatus && matchFound
      ? lobbyStatus.players.length >= matchFound.players.length
        ? lobbyStatus.players
        : matchFound.players
      : lobbyStatus?.players ?? matchFound?.players ?? [];
  const ownPlayer = session ? findOwnPlayer(players, session.playerId) : null;
  const opponent = session ? findOpponent(players, session.playerId) : null;
  const team = ownPlayer?.team ?? [];

  useEffect(() => {
    if (!session || !lobbyStatus || battleState) {
      return;
    }

    if (lobbyStatus.lobbyId !== session.currentLobbyId || lobbyStatus.players.length !== 2 || lobbyStatus.status !== 'waiting') {
      return;
    }

    if (ownPlayer?.team.length || ownPlayer?.ready) {
      return;
    }

    const assignCoordinatorId = [...lobbyStatus.players].map((player) => player.playerId).sort()[0];

    if (session.playerId !== assignCoordinatorId || autoAssignLobbyIdRef.current === lobbyStatus.lobbyId) {
      return;
    }

    autoAssignLobbyIdRef.current = lobbyStatus.lobbyId;
    void assignTeam();
  }, [
    assignTeam,
    battleState,
    lobbyStatus,
    ownPlayer?.ready,
    ownPlayer?.team.length,
    session,
  ]);

  useEffect(() => {
    if (!session || !lobbyStatus || battleState) {
      return;
    }

    if (lobbyStatus.lobbyId !== session.currentLobbyId || lobbyStatus.players.length !== 2 || ownPlayer?.ready || team.length !== 3) {
      return;
    }

    if (autoReadyLobbyIdRef.current === lobbyStatus.lobbyId) {
      return;
    }

    autoReadyLobbyIdRef.current = lobbyStatus.lobbyId;
    void markReady();
  }, [
    battleState,
    lobbyStatus,
    markReady,
    ownPlayer?.ready,
    session,
    team.length,
  ]);

  const flowState: BattleLobbyFlowState = useMemo(() => {
    if (session?.currentBattleId) {
      return 'battling';
    }

    if (opponent) {
      return 'matched';
    }

    if (searchState === 'searching') {
      return 'searching';
    }

    return 'idle';
  }, [opponent, searchState, session?.currentBattleId]);

  useEffect(() => {
    if (searchState !== 'searching' || !searchStartedAt || actionPending) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void stopSearch('timeout');
    }, Math.max(0, searchStartedAt + MATCH_SEARCH_TIMEOUT_MS - Date.now()));

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [actionPending, searchStartedAt, searchState, stopSearch]);

  useEffect(() => {
    if (searchState !== 'searching' || !searchStartedAt) {
      setSearchElapsedMs(null);
      return;
    }

    const syncElapsed = () => {
      setSearchElapsedMs(Math.min(MATCH_SEARCH_TIMEOUT_MS, Math.max(0, Date.now() - searchStartedAt)));
    };

    syncElapsed();
    const intervalId = window.setInterval(syncElapsed, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [searchStartedAt, searchState]);

  return {
    actionError,
    actionPending,
    attack,
    activityItems,
    assignTeam,
    battleResult,
    battleState,
    cancelSearch,
    connectionState,
    dismissBattleResult,
    flowState,
    latestTurnResult,
    lobbyStatus,
    markReady,
    ownPlayer,
    opponent,
    searchElapsedMs,
    searchMatch,
    team,
  };
}
