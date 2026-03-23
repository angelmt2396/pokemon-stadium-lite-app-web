import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useBattleLobby } from '@/features/battle/hooks/useBattleLobby';
import { useSession } from '@/features/session/context/SessionContext';
import { cn } from '@/lib/utils/cn';

const MATCH_FOUND_DURATION_MS = 1600;
const TEAM_ASSIGNED_DURATION_MS = 5000;
const BATTLE_START_DURATION_MS = 1800;
const TURN_ACTION_DURATION_MS = 1700;
const BATTLE_RECONNECT_GRACE_MS = 15_000;

type CinematicStage =
  | { id: string; type: 'match-found'; opponentName: string }
  | { id: string; type: 'team-assigned'; teamNames: string[] }
  | { id: string; type: 'battle-start'; ownLabel: string; opponentLabel: string }
  | { id: string; type: 'battle-result'; didWin: boolean; opponentName: string }
  | {
      id: string;
      type: 'turn-action';
      title: string;
      description: string;
      tone: 'attack' | 'impact' | 'ko';
    };

type BattleLocationState = {
  startSearch?: boolean;
};

function formatElapsedTime(totalMs: number) {
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getCinematicDuration(type: CinematicStage['type']) {
  if (type === 'team-assigned') {
    return TEAM_ASSIGNED_DURATION_MS;
  }

  if (type === 'battle-start') {
    return BATTLE_START_DURATION_MS;
  }

  if (type === 'turn-action') {
    return TURN_ACTION_DURATION_MS;
  }

  if (type === 'battle-result') {
    return null;
  }

  return MATCH_FOUND_DURATION_MS;
}

function getTeamSignature(team: Array<{ pokemonId: number; name: string }>) {
  return team.map((pokemon) => pokemon.pokemonId).join(',');
}

function findBattlePokemonName(
  players: Array<{
    playerId: string;
    activePokemon: { pokemonId: number; name: string } | null;
    team: Array<{ pokemonId: number; name: string }>;
  }>,
  playerId: string,
  pokemonId: number,
) {
  const player = players.find((item) => item.playerId === playerId);

  if (!player) {
    return null;
  }

  if (player.activePokemon?.pokemonId === pokemonId) {
    return player.activePokemon.name;
  }

  return player.team.find((pokemon) => pokemon.pokemonId === pokemonId)?.name ?? null;
}

export function BattlePage() {
  const { t } = useTranslation('battle');
  const { session } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const initialCinematicsReadyRef = useRef(!(session?.currentLobbyId || session?.currentBattleId));
  const handledEntrySearchKeyRef = useRef<string | null>(null);
  const shownMatchLobbyRef = useRef<string | null>(null);
  const shownTeamRevealRef = useRef<string | null>(null);
  const shownBattleIntroRef = useRef<string | null>(null);
  const shownBattleResultRef = useRef<string | null>(null);
  const shownTurnActionRef = useRef<string | null>(null);
  const lastKnownOpponentNameRef = useRef<string | null>(null);
  const lastTurnPlayerIdRef = useRef<string | null>(null);
  const {
    actionError,
    actionPending,
    attack,
    battleResult,
    battleState,
    cancelSearch,
    connectionState,
    dismissBattleResult,
    flowState,
    latestTurnResult,
    lobbyStatus,
    ownPlayer,
    opponent,
    searchElapsedMs,
    searchMatch,
    team,
  } = useBattleLobby();
  const [cinematicQueue, setCinematicQueue] = useState<CinematicStage[]>([]);
  const [activeCinematic, setActiveCinematic] = useState<CinematicStage | null>(null);
  const [pauseFallbackDeadlineAt, setPauseFallbackDeadlineAt] = useState<number | null>(null);
  const [pauseRemainingMs, setPauseRemainingMs] = useState<number | null>(null);
  const [impactCue, setImpactCue] = useState<{ key: string; target: 'self' | 'opponent'; damage: number; ko: boolean } | null>(null);
  const [turnPulseTarget, setTurnPulseTarget] = useState<'self' | 'opponent' | null>(null);
  const locationState = (location.state ?? null) as BattleLocationState | null;

  const ownBattlePlayer =
    battleState && session ? battleState.players.find((player) => player.playerId === session.playerId) ?? null : null;
  const opponentBattlePlayer =
    battleState && session ? battleState.players.find((player) => player.playerId !== session.playerId) ?? null : null;
  const ownActivePokemon = ownBattlePlayer?.activePokemon ?? null;
  const opponentActivePokemon = opponentBattlePlayer?.activePokemon ?? null;
  const isBattleFinished = Boolean(battleResult);
  const isBattlePaused = flowState === 'battling' && battleState?.status === 'paused';
  const isPlayerTurn =
    flowState === 'battling' && battleState?.status === 'battling' && battleState.currentTurnPlayerId === session?.playerId;
  const canAttack = Boolean(
    flowState === 'battling' &&
      battleState?.status === 'battling' &&
      ownActivePokemon &&
      !actionPending &&
      !isBattleFinished &&
      (battleState?.currentTurnPlayerId === null || battleState?.currentTurnPlayerId === session?.playerId),
  );
  const reconnectDeadlineMs = battleState?.reconnectDeadlineAt ? new Date(battleState.reconnectDeadlineAt).getTime() : null;
  const showReconnectOverlay = Boolean(
    flowState === 'battling' &&
      !isBattleFinished &&
      (isBattlePaused || (connectionState === 'disconnected' && session?.currentBattleId)),
  );
  const isSelfReconnectState = Boolean(
    showReconnectOverlay &&
      (connectionState === 'disconnected' ||
        battleState?.disconnectedPlayerId === session?.playerId),
  );
  const ownHpPercent = ownActivePokemon ? Math.max(8, (ownActivePokemon.currentHp / ownActivePokemon.hp) * 100) : 74;
  const opponentHpPercent = opponentActivePokemon
    ? Math.max(8, (opponentActivePokemon.currentHp / opponentActivePokemon.hp) * 100)
    : opponent
      ? 54
      : 16;
  const resolvedOpponentName = opponent?.nickname ?? lastKnownOpponentNameRef.current ?? t('status.fallbackOpponent');
  const battleResultReason = battleResult?.reason ?? null;
  const battleStatusHeadline =
    isBattlePaused
      ? t('lobby.pauseStatusLabel')
      : canAttack
        ? t('arena.attackNow')
        : t('arena.underAttack');
  const battleStatusDescription =
    isBattlePaused
      ? t('arena.pauseLiveDescription')
      : canAttack
        ? t('arena.attackNowDescription')
        : t('arena.underAttackDescription');
  const teamActionLabel = flowState === 'matched' && team.length === 0
    ? t('team.actions.autoAssigning')
    : flowState === 'matched' && team.length === 3 && !ownPlayer?.ready
      ? t('team.actions.autoReady')
      : isBattleFinished
        ? t('team.actions.finished')
        : isBattlePaused
          ? t('team.actions.paused')
        : ownPlayer?.ready
          ? t('team.actions.readyDone')
          : team.length === 3
            ? t('team.actions.assigned')
            : t('team.actions.waiting');
  const arenaBadgeLabel =
    isBattleFinished
      ? t('arena.finishedBadge')
      : isBattlePaused
        ? t('arena.pauseBadge')
      : flowState === 'battling'
        ? battleState?.currentTurnPlayerId === session?.playerId
          ? t('arena.yourTurn')
          : t('arena.opponentTurn')
        : t('arena.standbyStatus');

  const heroBadgeTone =
    isBattlePaused
      ? 'warning'
      : flowState === 'matched' || flowState === 'battling'
      ? 'success'
      : flowState === 'searching'
        ? 'warning'
        : 'info';

  const heroBadgeLabel =
    isBattleFinished
      ? t('lobby.badges.finished')
      : isBattlePaused
        ? t('lobby.badges.paused')
      : flowState === 'matched'
        ? t('lobby.badges.matched')
        : flowState === 'battling'
          ? t('lobby.badges.battling')
          : flowState === 'searching'
            ? t('lobby.badges.searching')
            : t('lobby.badges.idle');

  const connectionTone =
    connectionState === 'connected'
      ? 'success'
      : connectionState === 'connecting'
        ? 'warning'
        : 'neutral';

  const connectionLabel =
    connectionState === 'connected'
      ? t('status.connection.connected')
      : connectionState === 'connecting'
        ? t('status.connection.connecting')
        : t('status.connection.disconnected');

  const statusDescription =
    isBattleFinished
      ? battleResult?.winnerPlayerId === session?.playerId
        ? battleResultReason === 'disconnect_timeout'
          ? t('status.descriptions.wonByDisconnect')
          : t('status.descriptions.won')
        : battleResultReason === 'disconnect_timeout'
          ? t('status.descriptions.lostByDisconnect')
          : t('status.descriptions.lost')
      : isBattlePaused
        ? isSelfReconnectState
          ? t('status.descriptions.reconnectingSelf')
          : t('status.descriptions.reconnectingOpponent')
      : flowState === 'matched'
        ? t('status.descriptions.matched', { nickname: opponent?.nickname ?? t('status.fallbackOpponent') })
        : flowState === 'battling'
          ? t('status.descriptions.battling')
          : flowState === 'searching'
            ? t('status.descriptions.searching')
            : t('status.descriptions.idle');

  const heroTitle =
    flowState === 'searching'
      ? t('lobby.searchingTitle')
      : flowState === 'matched'
        ? t('lobby.matchedTitle')
        : isBattlePaused
          ? t('lobby.pausedTitle')
        : flowState === 'battling'
          ? t('lobby.battlingTitle')
          : t('lobby.title');

  const heroDescription =
    flowState === 'searching'
      ? t('lobby.searchingDescription')
      : flowState === 'matched'
        ? t('lobby.matchedDescription')
        : isBattlePaused
          ? isSelfReconnectState
            ? t('lobby.pausedDescriptionSelf')
            : t('lobby.pausedDescriptionOpponent')
        : flowState === 'battling'
          ? t('lobby.battlingDescription')
          : statusDescription;

  const teamSlots = Array.from({ length: 3 }, (_, index) => team[index] ?? null);
  const battleTeamSlots = Array.from({ length: 3 }, (_, index) => {
    const battlePokemon = ownBattlePlayer?.team[index] ?? null;

    if (battlePokemon) {
      return {
        pokemonId: battlePokemon.pokemonId,
        name: battlePokemon.name,
        sprite: battlePokemon.sprite,
        hp: battlePokemon.hp,
        currentHp: battlePokemon.currentHp,
        defeated: battlePokemon.defeated || battlePokemon.currentHp === 0,
        isActive: ownBattlePlayer?.activePokemonIndex === index,
      };
    }

    const assignedPokemon = team[index] ?? null;

    if (!assignedPokemon) {
      return null;
    }

    return {
      pokemonId: assignedPokemon.pokemonId,
      name: assignedPokemon.name,
      sprite: assignedPokemon.sprite,
      hp: null,
      currentHp: null,
      defeated: false,
      isActive: false,
    };
  });

  const enqueueCinematic = useCallback((stage: CinematicStage) => {
    setCinematicQueue((current) => {
      if (current.some((item) => item.id === stage.id)) {
        return current;
      }

      return [...current, stage];
    });
  }, []);

  useEffect(() => {
    if (connectionState === 'disconnected' && session?.currentBattleId && !battleResult && !battleState?.reconnectDeadlineAt) {
      setPauseFallbackDeadlineAt((current) => current ?? Date.now() + BATTLE_RECONNECT_GRACE_MS);
      return;
    }

    setPauseFallbackDeadlineAt(null);
  }, [battleResult, battleState?.reconnectDeadlineAt, connectionState, session?.currentBattleId]);

  useEffect(() => {
    if (!showReconnectOverlay) {
      setPauseRemainingMs(null);
      return;
    }

    const activeDeadline = reconnectDeadlineMs ?? pauseFallbackDeadlineAt;

    if (!activeDeadline) {
      setPauseRemainingMs(null);
      return;
    }

    const syncRemaining = () => {
      setPauseRemainingMs(Math.max(0, activeDeadline - Date.now()));
    };

    syncRemaining();
    const intervalId = window.setInterval(syncRemaining, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [pauseFallbackDeadlineAt, reconnectDeadlineMs, showReconnectOverlay]);

  useEffect(() => {
    if (!activeCinematic && cinematicQueue.length) {
      setActiveCinematic(cinematicQueue[0]);
      setCinematicQueue((current) => current.slice(1));
    }
  }, [activeCinematic, cinematicQueue]);

  useEffect(() => {
    if (!activeCinematic) {
      return;
    }

    const duration = getCinematicDuration(activeCinematic.type);

    if (duration === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setActiveCinematic(null);
    }, duration);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeCinematic]);

  useEffect(() => {
    if (initialCinematicsReadyRef.current) {
      return;
    }

    const hasHydratedState =
      flowState === 'searching' ||
      Boolean(lobbyStatus?.lobbyId) ||
      Boolean(battleState?.battleId);

    if (!hasHydratedState) {
      return;
    }

    shownMatchLobbyRef.current = flowState === 'matched' && lobbyStatus?.lobbyId ? lobbyStatus.lobbyId : shownMatchLobbyRef.current;
    shownTeamRevealRef.current =
      lobbyStatus?.lobbyId && team.length === 3 ? `${lobbyStatus.lobbyId}:${getTeamSignature(team)}` : shownTeamRevealRef.current;
    shownBattleIntroRef.current = battleState?.battleId ?? shownBattleIntroRef.current;
    shownBattleResultRef.current = battleResult?.battleId ?? shownBattleResultRef.current;
    initialCinematicsReadyRef.current = true;
  }, [battleResult?.battleId, battleState?.battleId, flowState, lobbyStatus?.lobbyId, team]);

  useEffect(() => {
    if (!initialCinematicsReadyRef.current) {
      return;
    }

    if (flowState === 'matched' && lobbyStatus?.lobbyId && opponent && shownMatchLobbyRef.current !== lobbyStatus.lobbyId) {
      shownMatchLobbyRef.current = lobbyStatus.lobbyId;
      enqueueCinematic({
        id: `match-${lobbyStatus.lobbyId}`,
        type: 'match-found',
        opponentName: opponent.nickname,
      });
    }
  }, [enqueueCinematic, flowState, lobbyStatus?.lobbyId, opponent]);

  useEffect(() => {
    if (!initialCinematicsReadyRef.current) {
      return;
    }

    const teamKey = lobbyStatus?.lobbyId && team.length === 3 ? `${lobbyStatus.lobbyId}:${getTeamSignature(team)}` : null;

    if (!teamKey || shownTeamRevealRef.current === teamKey) {
      return;
    }

    shownTeamRevealRef.current = teamKey;
    enqueueCinematic({
      id: `team-${teamKey}`,
      type: 'team-assigned',
      teamNames: team.map((pokemon) => pokemon.name),
    });
  }, [enqueueCinematic, lobbyStatus?.lobbyId, team]);

  useEffect(() => {
    if (!initialCinematicsReadyRef.current) {
      return;
    }

    if (!battleState?.battleId || shownBattleIntroRef.current === battleState.battleId) {
      return;
    }

    shownBattleIntroRef.current = battleState.battleId;
    enqueueCinematic({
      id: `battle-${battleState.battleId}`,
      type: 'battle-start',
      ownLabel: ownActivePokemon?.name ?? team[0]?.name ?? session?.nickname ?? t('arena.playerOnePokemon'),
      opponentLabel: opponentActivePokemon?.name ?? opponent?.nickname ?? t('arena.unknownOpponent'),
    });
  }, [
    battleState?.battleId,
    enqueueCinematic,
    opponent?.nickname,
    opponentActivePokemon?.name,
    ownActivePokemon?.name,
    session?.nickname,
    t,
    team,
  ]);

  useEffect(() => {
    if (opponent?.nickname) {
      lastKnownOpponentNameRef.current = opponent.nickname;
    }
  }, [opponent?.nickname]);

  useEffect(() => {
    if (flowState !== 'battling' || battleState?.status !== 'battling' || !battleState.currentTurnPlayerId || !session?.playerId) {
      lastTurnPlayerIdRef.current = battleState?.currentTurnPlayerId ?? null;
      return;
    }

    if (!lastTurnPlayerIdRef.current) {
      lastTurnPlayerIdRef.current = battleState.currentTurnPlayerId;
      return;
    }

    if (lastTurnPlayerIdRef.current === battleState.currentTurnPlayerId) {
      return;
    }

    lastTurnPlayerIdRef.current = battleState.currentTurnPlayerId;
    setTurnPulseTarget(battleState.currentTurnPlayerId === session.playerId ? 'self' : 'opponent');
  }, [battleState?.currentTurnPlayerId, battleState?.status, flowState, session?.playerId]);

  useEffect(() => {
    if (!turnPulseTarget) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setTurnPulseTarget(null);
    }, 1400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [turnPulseTarget]);

  useEffect(() => {
    if (!initialCinematicsReadyRef.current || !battleResult?.battleId || shownBattleResultRef.current === battleResult.battleId) {
      return;
    }

    shownBattleResultRef.current = battleResult.battleId;
    enqueueCinematic({
      id: `result-${battleResult.battleId}`,
      type: 'battle-result',
      didWin: battleResult.winnerPlayerId === session?.playerId,
      opponentName: resolvedOpponentName,
    });
  }, [battleResult, enqueueCinematic, resolvedOpponentName, session?.playerId]);

  useEffect(() => {
    if (!latestTurnResult || !battleState?.players.length || !session?.playerId) {
      return;
    }

    const turnKey = [
      latestTurnResult.battleId,
      latestTurnResult.attackerPlayerId,
      latestTurnResult.defenderPlayerId,
      latestTurnResult.attackerPokemonId,
      latestTurnResult.defenderPokemonId,
      latestTurnResult.damage,
      latestTurnResult.defenderRemainingHp,
      latestTurnResult.defenderDefeated ? 'ko' : 'live',
    ].join(':');

    if (shownTurnActionRef.current === turnKey) {
      return;
    }

    shownTurnActionRef.current = turnKey;

    const attackerPokemonName =
      findBattlePokemonName(
        battleState.players,
        latestTurnResult.attackerPlayerId,
        latestTurnResult.attackerPokemonId,
      ) ?? t('preview.trainerFallback');
    const defenderPokemonName =
      findBattlePokemonName(
        battleState.players,
        latestTurnResult.defenderPlayerId,
        latestTurnResult.defenderPokemonId,
      ) ?? t('arena.unknownOpponent');
    const isAttacker = latestTurnResult.attackerPlayerId === session.playerId;
    const damagePayload = {
      pokemon: defenderPokemonName,
      damage: latestTurnResult.damage,
    };
    setImpactCue({
      key: turnKey,
      target: isAttacker ? 'opponent' : 'self',
      damage: latestTurnResult.damage,
      ko: latestTurnResult.defenderDefeated,
    });

    if (isAttacker) {
      enqueueCinematic({
        id: `${turnKey}:attack`,
        type: 'turn-action',
        title: t('cinematics.turnAction.attackTitle'),
        description: t('cinematics.turnAction.attackDescription', {
          pokemon: attackerPokemonName,
        }),
        tone: 'attack',
      });
      enqueueCinematic({
        id: `${turnKey}:impact`,
        type: 'turn-action',
        title: latestTurnResult.defenderDefeated
          ? t('cinematics.turnAction.koTitle')
          : t('cinematics.turnAction.damageDealtTitle'),
        description: latestTurnResult.defenderDefeated
          ? t('cinematics.turnAction.damageDealtKoDescription', damagePayload)
          : t('cinematics.turnAction.damageDealtDescription', damagePayload),
        tone: latestTurnResult.defenderDefeated ? 'ko' : 'impact',
      });
      if (latestTurnResult.autoSwitchedPokemon?.pokemon) {
        enqueueCinematic({
          id: `${turnKey}:switch`,
          type: 'turn-action',
          title: t('cinematics.turnAction.switchTitle'),
          description:
            latestTurnResult.autoSwitchedPokemon.playerId === session.playerId
              ? t('cinematics.turnAction.switchDescriptionSelf', {
                  pokemon: latestTurnResult.autoSwitchedPokemon.pokemon.name,
                })
              : t('cinematics.turnAction.switchDescriptionOpponent', {
                  pokemon: latestTurnResult.autoSwitchedPokemon.pokemon.name,
                }),
          tone: 'attack',
        });
      }
      return;
    }

    if (latestTurnResult.defenderPlayerId !== session.playerId) {
      return;
    }

    enqueueCinematic({
      id: `${turnKey}:received`,
      type: 'turn-action',
      title: t('cinematics.turnAction.attackReceivedTitle'),
      description: t('cinematics.turnAction.attackReceivedDescription', {
        pokemon: attackerPokemonName,
      }),
      tone: 'impact',
    });
    enqueueCinematic({
      id: `${turnKey}:damage`,
      type: 'turn-action',
      title: latestTurnResult.defenderDefeated
        ? t('cinematics.turnAction.koTitle')
        : t('cinematics.turnAction.damageReceivedTitle'),
      description: latestTurnResult.defenderDefeated
        ? t('cinematics.turnAction.damageReceivedKoDescription', damagePayload)
        : t('cinematics.turnAction.damageReceivedDescription', damagePayload),
      tone: latestTurnResult.defenderDefeated ? 'ko' : 'impact',
    });
    if (latestTurnResult.autoSwitchedPokemon?.pokemon) {
      enqueueCinematic({
        id: `${turnKey}:switch`,
        type: 'turn-action',
        title: t('cinematics.turnAction.switchTitle'),
        description:
          latestTurnResult.autoSwitchedPokemon.playerId === session.playerId
            ? t('cinematics.turnAction.switchDescriptionSelf', {
                pokemon: latestTurnResult.autoSwitchedPokemon.pokemon.name,
              })
            : t('cinematics.turnAction.switchDescriptionOpponent', {
                pokemon: latestTurnResult.autoSwitchedPokemon.pokemon.name,
              }),
        tone: 'attack',
      });
    }
  }, [battleState?.players, enqueueCinematic, latestTurnResult, session?.playerId, t]);

  useEffect(() => {
    if (!impactCue) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setImpactCue(null);
    }, 1150);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [impactCue]);

  const handleCloseBattleResult = useCallback(() => {
    setActiveCinematic((current) => (current?.type === 'battle-result' ? null : current));
    dismissBattleResult();
  }, [dismissBattleResult]);

  useEffect(() => {
    if (!locationState?.startSearch) {
      return;
    }

    if (handledEntrySearchKeyRef.current === location.key) {
      return;
    }

    if (flowState !== 'idle' || actionPending || session?.currentLobbyId || session?.currentBattleId) {
      return;
    }

    handledEntrySearchKeyRef.current = location.key;
    navigate(location.pathname, { replace: true });
    void searchMatch();
  }, [
    actionPending,
    flowState,
    location.key,
    location.pathname,
    locationState?.startSearch,
    navigate,
    searchMatch,
    session?.currentBattleId,
    session?.currentLobbyId,
  ]);

  const waitingRoom = (
    <>
      <section className="mb-4 space-y-4 md:hidden">
        <div className="game-frame relative overflow-hidden px-5 py-5">
          <div className="pointer-events-none absolute right-[-20px] top-[-20px] h-20 w-20 rounded-full border border-amber-200/60 bg-white/25" />

          <div className="relative space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={heroBadgeLabel} tone={heroBadgeTone} />
              <StatusBadge label={connectionLabel} tone={connectionTone} />
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {t('lobby.player', { nickname: session?.nickname ?? 'Trainer' })}
              </p>
              <h2 className="text-3xl font-black tracking-tight">{heroTitle}</h2>
              <p className="text-sm leading-6 text-slate-600">{heroDescription}</p>
            </div>

            {(flowState === 'searching' || opponent) ? (
              <div className="rounded-[1.3rem] border border-slate-200/80 bg-white/85 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {flowState === 'searching' ? t('lobby.timerLabel') : t('status.timeline.matching')}
                </p>
                <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  {flowState === 'searching'
                    ? formatElapsedTime(searchElapsedMs ?? 0)
                    : opponent?.nickname ?? resolvedOpponentName}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {flowState === 'searching' ? t('lobby.autoSearching') : t('lobby.matchedDescription')}
                </p>
              </div>
            ) : null}

            {actionError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                {actionError}
              </div>
            ) : null}

            {flowState === 'searching' ? (
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 w-full rounded-full text-xs font-bold uppercase tracking-[0.16em]"
                disabled={actionPending}
                onClick={() => {
                  void cancelSearch();
                }}
              >
                {t('lobby.secondaryAction')}
              </Button>
            ) : flowState === 'idle' ? (
              <Button
                type="button"
                className="min-h-11 w-full rounded-full text-xs font-bold uppercase tracking-[0.16em]"
                disabled={actionPending}
                onClick={() => {
                  void searchMatch();
                }}
              >
                {actionPending ? t('lobby.searchingAction') : t('lobby.primaryAction')}
              </Button>
            ) : null}
          </div>
        </div>

        <Card className="game-frame relative overflow-hidden border-slate-950/8 bg-[radial-gradient(circle_at_top_right,_rgba(89,201,255,0.12),_transparent_30%),linear-gradient(160deg,_rgba(8,12,34,0.98),_rgba(19,30,61,0.92))] p-5 text-white">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">{t('arena.kicker')}</p>
              <h3 className="mt-2 text-xl font-black tracking-tight">{t('arena.standbyTitle')}</h3>
            </div>
            <StatusBadge label={t('arena.standbyStatus')} tone="info" className="bg-white/10 text-white" />
          </div>

          <div className="space-y-3">
            <div className="rounded-[1.5rem] border border-white/8 bg-white/6 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">{t('arena.playerOne')}</p>
              <p className="mt-2 text-xl font-bold">{session?.nickname ?? t('arena.playerOnePokemon')}</p>
              <p className="mt-2 text-sm text-white/60">{t('arena.waitingStart')}</p>
            </div>
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/8 text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
                VS
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-white/8 bg-white/8 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">{t('arena.playerTwo')}</p>
              <p className="mt-2 text-xl font-bold">{opponent?.nickname ?? t('arena.unknownOpponent')}</p>
              <p className="mt-2 text-sm text-white/60">{t('arena.waitingMatch')}</p>
            </div>
          </div>
        </Card>

        <Card className="game-frame border-slate-950/8 bg-white/90 p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold">{t('team.title')}</h3>
            <Button variant="secondary" className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em]" disabled>
              {teamActionLabel}
            </Button>
          </div>
          <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
            {teamSlots.map((pokemon, index) => (
              <div
                key={pokemon?.pokemonId ?? index}
                className={cn(
                  'min-w-[180px] snap-start rounded-[1.35rem] border px-4 py-4',
                  pokemon ? 'border-slate-200/80 bg-white shadow-[0_12px_24px_rgba(15,23,42,0.06)]' : 'border-dashed border-slate-200 bg-slate-50',
                )}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t('team.slotLabel', { slot: index + 1 })}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="min-w-0 break-words text-base font-bold text-ink">{pokemon?.name ?? t('team.slotWaiting')}</p>
                  {pokemon?.sprite ? <img alt={pokemon.name} className="h-14 w-14 shrink-0 object-contain" src={pokemon.sprite} /> : null}
                </div>
              </div>
            ))}
          </div>
        </Card>

      </section>

      <div className="hidden md:block">
      <section className="mb-6">
        <div className="game-frame relative overflow-hidden px-6 py-7 md:px-8 md:py-8">
          <div className="pointer-events-none absolute right-[-24px] top-[-24px] h-24 w-24 rounded-full border border-amber-200/60 bg-white/25" />
          <div className="pointer-events-none absolute bottom-[-30px] left-20 h-24 w-24 rounded-full bg-amber-200/18 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge label={heroBadgeLabel} tone={heroBadgeTone} />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {t('lobby.player', { nickname: session?.nickname ?? 'Trainer' })}
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tight md:text-5xl">{heroTitle}</h2>
                <p className="max-w-xl text-base text-slate-600 md:text-lg">{heroDescription}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusBadge label={connectionLabel} tone={connectionTone} />
                <StatusBadge label={flowState === 'searching' ? t('lobby.queueLabel') : heroBadgeLabel} tone={heroBadgeTone} />
                {opponent || flowState === 'searching' ? (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {opponent ? t('status.opponent', { nickname: opponent.nickname }) : t('status.waitingOpponent')}
                  </span>
                ) : null}
              </div>

              {actionError ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                  {actionError}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                {flowState === 'searching' ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-full px-5 py-3 text-xs font-bold uppercase tracking-[0.16em]"
                    disabled={actionPending}
                    onClick={() => {
                      void cancelSearch();
                    }}
                  >
                    {t('lobby.secondaryAction')}
                  </Button>
                ) : flowState === 'idle' ? (
                  <Button
                    type="button"
                    className="rounded-full px-5 py-3 text-xs font-bold uppercase tracking-[0.16em]"
                    disabled={actionPending}
                    onClick={() => {
                      void searchMatch();
                    }}
                  >
                    {actionPending ? t('lobby.searchingAction') : t('lobby.primaryAction')}
                  </Button>
                ) : null}
              </div>
            </div>

            {flowState === 'searching' ? (
              <div className="w-full max-w-[260px] rounded-[1.8rem] border border-amber-200/70 bg-[linear-gradient(180deg,_rgba(255,249,236,0.98),_rgba(255,255,255,0.9))] px-5 py-4 shadow-[0_18px_32px_rgba(217,119,6,0.08)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">{t('lobby.timerLabel')}</p>
                <p className="mt-3 text-5xl font-black tracking-tight text-amber-950">
                  {formatElapsedTime(searchElapsedMs ?? 0)}
                </p>
                <p className="mt-3 text-sm text-amber-900/80">{t('lobby.autoSearching')}</p>
              </div>
            ) : flowState === 'matched' ? (
              <div className="w-full max-w-[280px] rounded-[1.8rem] border border-cyan-200/70 bg-[linear-gradient(180deg,_rgba(236,254,255,0.98),_rgba(255,255,255,0.92))] px-5 py-4 shadow-[0_18px_32px_rgba(6,182,212,0.08)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-700">{t('status.timeline.matching')}</p>
                <p className="mt-3 text-2xl font-black tracking-tight text-slate-950">{opponent?.nickname ?? t('status.fallbackOpponent')}</p>
                <p className="mt-3 text-sm text-slate-600">{t('lobby.matchedDescription')}</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
      </div>

      <section className="hidden gap-6 xl:grid-cols-[1.15fr_0.85fr] md:grid">
        <Card className="game-frame relative overflow-hidden border-slate-950/8 bg-[radial-gradient(circle_at_top_right,_rgba(89,201,255,0.12),_transparent_30%),linear-gradient(160deg,_rgba(8,12,34,0.98),_rgba(19,30,61,0.92))] p-6 text-white">
          <div className="pointer-events-none absolute -right-8 top-10 h-40 w-40 rounded-full border border-white/8" />
          <div className="pointer-events-none absolute bottom-12 right-10 h-28 w-28 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">{t('arena.kicker')}</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight">{t('arena.standbyTitle')}</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">{t('arena.standbyDescription')}</p>
            </div>
            <StatusBadge label={t('arena.standbyStatus')} tone="info" className="bg-white/10 text-white" />
          </div>

          {actionError ? (
            <div className="mb-5 rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm font-medium text-amber-100">
              {actionError}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="rounded-[1.9rem] border border-white/8 bg-white/6 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-white/45">{t('arena.playerOne')}</p>
              <h4 className="mt-3 text-2xl font-bold">{session?.nickname ?? t('arena.playerOnePokemon')}</h4>
              <p className="mt-2 text-sm text-white/60">{t('arena.waitingStart')}</p>
              <div className="mt-5 h-3 rounded-full bg-white/10">
                <div className="h-3 rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300 transition-all" style={{ width: '74%' }} />
              </div>
            </div>

            <div className="flex justify-center">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/8">
                <div className="absolute inset-2 rounded-full border border-cyan-200/20" />
                <div className="absolute inset-0 rounded-full border border-cyan-200/14 animate-ping" />
                <span className="relative text-xs font-black uppercase tracking-[0.22em] text-cyan-100">VS</span>
              </div>
            </div>

            <div className="rounded-[1.9rem] border border-white/8 bg-white/8 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-white/45">{t('arena.playerTwo')}</p>
              <h4 className="mt-3 text-2xl font-bold">{opponent?.nickname ?? t('arena.unknownOpponent')}</h4>
              <p className="mt-2 text-sm text-white/60">{t('arena.waitingMatch')}</p>
              <div className="mt-5 h-3 rounded-full bg-white/10">
                <div className={`h-3 rounded-full transition-all ${opponent ? 'bg-gradient-to-r from-cyan-300 to-fuchsia-300' : 'bg-white/25'}`} style={{ width: `${opponent ? 54 : 16}%` }} />
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6">
          <Card className="game-frame border-slate-950/8 bg-white/90 p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold">{t('team.title')}</h3>
              <Button variant="secondary" className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em]" disabled>
                {teamActionLabel}
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {teamSlots.map((pokemon, index) => (
                <div
                  key={pokemon?.pokemonId ?? index}
                  className={`rounded-[1.45rem] border px-4 py-4 ${
                    pokemon ? 'border-slate-200/80 bg-white shadow-[0_12px_24px_rgba(15,23,42,0.06)]' : 'border-dashed border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t('team.slotLabel', { slot: index + 1 })}</p>
                      <p className="mt-3 text-base font-bold text-ink">{pokemon?.name ?? t('team.slotWaiting')}</p>
                    </div>
                    {pokemon?.sprite ? (
                      <img
                        alt={pokemon.name}
                        className="h-16 w-16 shrink-0 object-contain drop-shadow-[0_10px_14px_rgba(15,23,42,0.16)]"
                        src={pokemon.sprite}
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </div>
      </section>
    </>
  );

  const battleHud = (
    <>
      <section className="mb-4 space-y-4 md:hidden">
        <div className="game-frame relative overflow-hidden px-4 py-4">
          <div className="relative space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={heroBadgeLabel} tone={heroBadgeTone} />
              <StatusBadge label={connectionLabel} tone={connectionTone} />
              <StatusBadge
                label={
                  isBattlePaused
                    ? t('lobby.pauseStatusLabel')
                    : isPlayerTurn
                      ? t('lobby.yourTurnLabel')
                      : t('lobby.opponentTurnLabel')
                }
                tone={isBattlePaused ? 'warning' : isPlayerTurn ? 'success' : 'neutral'}
              />
            </div>

            <div className="rounded-[1.2rem] border border-slate-200/80 bg-white/85 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {t('lobby.opponentLabel')}: {resolvedOpponentName}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {battleStatusDescription}
              </p>
            </div>
          </div>
        </div>

        <Card className="game-frame relative overflow-hidden border-slate-950/8 bg-[radial-gradient(circle_at_top_right,_rgba(89,201,255,0.12),_transparent_30%),linear-gradient(160deg,_rgba(8,12,34,0.98),_rgba(19,30,61,0.92))] p-5 text-white">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">{t('arena.kicker')}</p>
              <h3 className="mt-2 text-xl font-black tracking-tight">{t('arena.title')}</h3>
            </div>
            <StatusBadge label={arenaBadgeLabel} tone="info" className="bg-white/10 text-white" />
          </div>

          <div className="space-y-3">
            <div
              className={cn(
                'relative rounded-[1.6rem] border border-white/8 bg-white/8 p-4 transition',
                (turnPulseTarget === 'opponent' || (!isPlayerTurn && !isBattlePaused)) && 'battle-turn-glow',
                impactCue?.target === 'opponent' && 'battle-impact-card',
              )}
            >
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">{t('arena.playerTwo')}</p>
              <p className="mt-2 break-words text-2xl font-bold">{opponentActivePokemon?.name ?? resolvedOpponentName}</p>
              <p className="mt-2 text-sm text-white/60">
                {opponentActivePokemon
                  ? t('arena.hpLabel', {
                      currentHp: opponentActivePokemon.currentHp,
                      hp: opponentActivePokemon.hp,
                    })
                  : t('arena.waitingStart')}
              </p>
              <div className="mt-4 flex h-32 items-center justify-center rounded-[1.4rem] border border-white/8 bg-white/6 px-3 py-3">
                {opponentActivePokemon?.sprite ? (
                  <img
                    alt={opponentActivePokemon.name}
                    className={cn('h-full w-full object-contain', opponentActivePokemon.defeated ? 'grayscale opacity-45' : '')}
                    src={opponentActivePokemon.sprite}
                  />
                ) : null}
              </div>
              {impactCue?.target === 'opponent' ? (
                <div className="pointer-events-none absolute right-4 top-16 battle-damage-float rounded-full border border-rose-200/25 bg-rose-400/18 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-rose-50 shadow-[0_16px_28px_rgba(244,63,94,0.18)]">
                  {impactCue.ko ? t('arena.knockedOut') : t('arena.damageTaken', { damage: impactCue.damage })}
                </div>
              ) : null}
              <div className="mt-4 h-3 rounded-full bg-white/10">
                <div className="h-3 rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-300 transition-all" style={{ width: `${opponentHpPercent}%` }} />
              </div>
            </div>

            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/8 text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
                VS
              </div>
            </div>

            <div
              className={cn(
                'relative rounded-[1.6rem] border border-white/8 bg-white/6 p-4 transition',
                (turnPulseTarget === 'self' || (isPlayerTurn && !isBattlePaused)) && 'battle-turn-glow',
                impactCue?.target === 'self' && 'battle-impact-card',
              )}
            >
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">{t('arena.playerOne')}</p>
              <p className="mt-2 break-words text-2xl font-bold">{ownActivePokemon?.name ?? session?.nickname ?? t('arena.playerOnePokemon')}</p>
              <p className="mt-2 text-sm text-white/60">
                {ownActivePokemon
                  ? t('arena.hpLabel', {
                      currentHp: ownActivePokemon.currentHp,
                      hp: ownActivePokemon.hp,
                    })
                  : t('arena.waitingStart')}
              </p>
              <div className="mt-4 flex h-32 items-center justify-center rounded-[1.4rem] border border-white/8 bg-white/6 px-3 py-3">
                {ownActivePokemon?.sprite ? (
                  <img
                    alt={ownActivePokemon.name}
                    className={cn('h-full w-full object-contain', ownActivePokemon.defeated ? 'grayscale opacity-45' : '')}
                    src={ownActivePokemon.sprite}
                  />
                ) : null}
              </div>
              {impactCue?.target === 'self' ? (
                <div className="pointer-events-none absolute right-4 top-16 battle-damage-float rounded-full border border-rose-200/25 bg-rose-400/18 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-rose-50 shadow-[0_16px_28px_rgba(244,63,94,0.18)]">
                  {impactCue.ko ? t('arena.knockedOut') : t('arena.damageTaken', { damage: impactCue.damage })}
                </div>
              ) : null}
              <div className="mt-4 h-3 rounded-full bg-white/10">
                <div className="h-3 rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300 transition-all" style={{ width: `${ownHpPercent}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className={cn(
              'rounded-[1.4rem] border border-white/8 bg-white/8 px-4 py-4 transition',
              canAttack && !isBattlePaused ? 'shadow-[0_0_0_1px_rgba(52,211,153,0.32),0_18px_36px_rgba(16,185,129,0.12)]' : '',
            )}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">{battleStatusHeadline}</p>
              <p className="mt-2 text-sm font-medium text-white/78">
                {isBattleFinished
                  ? battleResult?.winnerPlayerId === session?.playerId
                    ? t('arena.result.win')
                    : t('arena.result.lose')
                  : isBattlePaused
                    ? isSelfReconnectState
                      ? t('arena.pauseSelf')
                      : t('arena.pauseOpponent')
                  : battleStatusDescription}
              </p>
            </div>
            <Button
              type="button"
              className={cn(
                'min-h-12 w-full rounded-2xl px-5 py-3 font-black transition',
                canAttack ? 'ring-2 ring-emerald-200/80 shadow-[0_18px_38px_rgba(16,185,129,0.2)]' : '',
              )}
              disabled={!canAttack}
              onClick={() => {
                void attack();
              }}
            >
              {canAttack ? (actionPending ? t('arena.attackPending') : t('arena.attackAction')) : t('arena.waitingAction')}
            </Button>
          </div>
        </Card>

        <Card className="game-frame border-slate-950/8 bg-white/90 p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold">{t('team.title')}</h3>
            <Button variant="secondary" className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em]" disabled>
              {teamActionLabel}
            </Button>
          </div>
          <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
            {battleTeamSlots.map((pokemon, index) => (
              <div
                key={pokemon?.pokemonId ?? index}
                className={cn(
                  'min-w-[190px] snap-start rounded-[1.35rem] border px-4 py-4 shadow-[0_12px_24px_rgba(15,23,42,0.06)]',
                  pokemon ? 'bg-white' : 'border-dashed border-slate-200 bg-slate-50',
                  pokemon?.isActive ? 'border-cyan-300 ring-2 ring-cyan-200/80' : '',
                  pokemon?.defeated ? 'border-slate-200/70 bg-slate-100 opacity-70' : 'border-slate-200/80',
                )}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t('team.slotLabel', { slot: index + 1 })}</p>
                <p className="mt-3 break-words text-base font-bold text-ink">{pokemon?.name ?? t('team.slotWaiting')}</p>
                {pokemon && pokemon.currentHp !== null && pokemon.hp !== null ? (
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {t('arena.hpLabel', {
                      currentHp: pokemon.currentHp,
                      hp: pokemon.hp,
                    })}
                  </p>
                ) : null}
                <div className="mt-4 flex h-20 items-center justify-center rounded-[1.2rem] border border-slate-100 bg-slate-50/80 px-2 py-3">
                  {pokemon?.sprite ? (
                    <img
                      alt={pokemon.name}
                      className={cn('h-16 w-16 object-contain', pokemon.defeated ? 'grayscale opacity-45' : '')}
                      src={pokemon.sprite}
                    />
                  ) : null}
                </div>
                {pokemon ? (
                  <div className="mt-4 flex items-center gap-2">
                    {pokemon.isActive ? (
                      <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-700">
                        {t('team.activeBadge')}
                      </span>
                    ) : null}
                    {pokemon.defeated ? (
                      <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">
                        {t('team.koBadge')}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Card>

      </section>

      <div className="hidden md:block">
      <section className="mb-6">
        <div className="game-frame relative overflow-hidden px-6 py-5 md:px-8">
          <div className="pointer-events-none absolute right-[-20px] top-[-20px] h-24 w-24 rounded-full border border-emerald-200/50 bg-white/25" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge label={heroBadgeLabel} tone={heroBadgeTone} />
              <StatusBadge label={connectionLabel} tone={connectionTone} />
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {t('lobby.opponentLabel')}: {opponent?.nickname ?? t('status.fallbackOpponent')}
              </span>
            </div>

            <div className="rounded-full border border-emerald-200/80 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
              {isBattlePaused
                ? t('lobby.pauseStatusLabel')
                : isPlayerTurn
                  ? t('lobby.yourTurnLabel')
                  : t('lobby.opponentTurnLabel')}
            </div>
          </div>
        </div>
      </section>
      </div>

      <section className="hidden gap-6 xl:grid-cols-[1.15fr_0.85fr] md:grid">
        <Card className="game-frame relative overflow-hidden border-slate-950/8 bg-[radial-gradient(circle_at_top_right,_rgba(89,201,255,0.12),_transparent_30%),linear-gradient(160deg,_rgba(8,12,34,0.98),_rgba(19,30,61,0.92))] p-6 text-white">
          <div className="pointer-events-none absolute -right-8 top-10 h-40 w-40 rounded-full border border-white/8" />
          <div className="pointer-events-none absolute bottom-12 right-10 h-28 w-28 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">{t('arena.kicker')}</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight">{t('arena.title')}</h3>
            </div>
            <StatusBadge label={arenaBadgeLabel} tone="info" className="bg-white/10 text-white" />
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div
              className={cn(
                'relative rounded-[1.9rem] border border-white/8 bg-white/6 p-5 transition',
                (turnPulseTarget === 'self' || (isPlayerTurn && !isBattlePaused)) && 'battle-turn-glow',
                impactCue?.target === 'self' && 'battle-impact-card',
              )}
            >
              <div className="grid min-h-[240px] grid-rows-[auto_1fr_auto] gap-5">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/45">{t('arena.playerOne')}</p>
                  <h4 className="mt-3 break-words text-2xl font-bold">{ownActivePokemon?.name ?? session?.nickname ?? t('arena.playerOnePokemon')}</h4>
                  <p className="mt-2 text-sm text-white/60">
                    {ownActivePokemon
                      ? t('arena.hpLabel', {
                          currentHp: ownActivePokemon.currentHp,
                          hp: ownActivePokemon.hp,
                        })
                      : t('arena.waitingStart')}
                  </p>
                </div>

                <div className="flex h-40 items-center justify-center rounded-[1.6rem] border border-white/8 bg-white/6 px-3 py-4">
                  {ownActivePokemon?.sprite ? (
                    <img
                      alt={ownActivePokemon.name}
                      className={cn(
                        'h-full w-full object-contain drop-shadow-[0_16px_24px_rgba(34,211,238,0.2)] transition',
                        ownActivePokemon.defeated ? 'grayscale opacity-45' : '',
                      )}
                      src={ownActivePokemon.sprite}
                    />
                  ) : (
                    <div className="h-full w-full rounded-[1.2rem] border border-dashed border-white/10 bg-white/4" />
                  )}
                </div>
                {impactCue?.target === 'self' ? (
                  <div className="pointer-events-none absolute right-5 top-14 battle-damage-float rounded-full border border-rose-200/25 bg-rose-400/18 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-rose-50 shadow-[0_16px_28px_rgba(244,63,94,0.18)]">
                    {impactCue.ko ? t('arena.knockedOut') : t('arena.damageTaken', { damage: impactCue.damage })}
                  </div>
                ) : null}

                <div className="h-3 rounded-full bg-white/10">
                  <div className="h-3 rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300 transition-all" style={{ width: `${ownHpPercent}%` }} />
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/8">
                <div className="absolute inset-2 rounded-full border border-cyan-200/20" />
                <div className="absolute inset-0 rounded-full border border-cyan-200/14 animate-ping" />
                <span className="relative text-xs font-black uppercase tracking-[0.22em] text-cyan-100">VS</span>
              </div>
            </div>

            <div
              className={cn(
                'relative rounded-[1.9rem] border border-white/8 bg-white/8 p-5 transition',
                (turnPulseTarget === 'opponent' || (!isPlayerTurn && !isBattlePaused)) && 'battle-turn-glow',
                impactCue?.target === 'opponent' && 'battle-impact-card',
              )}
            >
              <div className="grid min-h-[240px] grid-rows-[auto_1fr_auto] gap-5">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/45">{t('arena.playerTwo')}</p>
                  <h4 className="mt-3 break-words text-2xl font-bold">{opponentActivePokemon?.name ?? opponent?.nickname ?? t('arena.unknownOpponent')}</h4>
                  <p className="mt-2 text-sm text-white/60">
                    {opponentActivePokemon
                      ? t('arena.hpLabel', {
                          currentHp: opponentActivePokemon.currentHp,
                          hp: opponentActivePokemon.hp,
                        })
                      : t('arena.waitingStart')}
                  </p>
                </div>

                <div className="flex h-40 items-center justify-center rounded-[1.6rem] border border-white/8 bg-white/6 px-3 py-4">
                  {opponentActivePokemon?.sprite ? (
                    <img
                      alt={opponentActivePokemon.name}
                      className={cn(
                        'h-full w-full object-contain drop-shadow-[0_16px_24px_rgba(217,70,239,0.2)] transition',
                        opponentActivePokemon.defeated ? 'grayscale opacity-45' : '',
                      )}
                      src={opponentActivePokemon.sprite}
                    />
                  ) : (
                    <div className="h-full w-full rounded-[1.2rem] border border-dashed border-white/10 bg-white/4" />
                  )}
                </div>
                {impactCue?.target === 'opponent' ? (
                  <div className="pointer-events-none absolute right-5 top-14 battle-damage-float rounded-full border border-rose-200/25 bg-rose-400/18 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-rose-50 shadow-[0_16px_28px_rgba(244,63,94,0.18)]">
                    {impactCue.ko ? t('arena.knockedOut') : t('arena.damageTaken', { damage: impactCue.damage })}
                  </div>
                ) : null}

                <div className="h-3 rounded-full bg-white/10">
                  <div className="h-3 rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-300 transition-all" style={{ width: `${opponentHpPercent}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-6 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div
              className={cn(
                'rounded-[1.4rem] border border-white/8 bg-white/8 px-4 py-4 transition',
                canAttack && !isBattlePaused ? 'shadow-[0_0_0_1px_rgba(52,211,153,0.32),0_18px_36px_rgba(16,185,129,0.12)]' : '',
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">{battleStatusHeadline}</p>
              <p className="mt-2 text-sm font-medium text-white/78">
                {isBattleFinished
                  ? battleResult?.winnerPlayerId === session?.playerId
                    ? t('arena.result.win')
                    : t('arena.result.lose')
                  : isBattlePaused
                    ? isSelfReconnectState
                      ? t('arena.pauseSelf')
                      : t('arena.pauseOpponent')
                  : battleStatusDescription}
              </p>
            </div>
            <Button
              type="button"
              className={cn(
                'relative z-10 min-h-12 rounded-2xl px-5 py-3 font-black transition',
                canAttack ? 'ring-2 ring-emerald-200/80 shadow-[0_18px_38px_rgba(16,185,129,0.2)]' : '',
              )}
              disabled={!canAttack}
              onClick={() => {
                void attack();
              }}
            >
              {canAttack ? (actionPending ? t('arena.attackPending') : t('arena.attackAction')) : t('arena.waitingAction')}
            </Button>
          </div>
        </Card>

        <div className="grid gap-6">
          <Card className="game-frame border-slate-950/8 bg-white/90 p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold">{t('team.title')}</h3>
              <Button variant="secondary" className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em]" disabled>
                {teamActionLabel}
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {battleTeamSlots.map((pokemon, index) => (
                <div
                  key={pokemon?.pokemonId ?? index}
                  className={cn(
                    'rounded-[1.45rem] border px-4 py-4 shadow-[0_12px_24px_rgba(15,23,42,0.06)] transition',
                    pokemon
                      ? 'bg-white'
                      : 'border-dashed border-slate-200 bg-slate-50',
                    pokemon?.isActive
                      ? 'border-cyan-300 ring-2 ring-cyan-200/80'
                      : pokemon?.defeated
                        ? 'border-slate-200/70 bg-slate-100'
                        : 'border-slate-200/80',
                    pokemon?.defeated ? 'opacity-70' : '',
                  )}
                >
                  <div className="grid min-h-[220px] grid-rows-[auto_1fr_auto] gap-4">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t('team.slotLabel', { slot: index + 1 })}</p>
                      <p className="mt-3 break-words text-base font-bold text-ink">{pokemon?.name ?? t('team.slotWaiting')}</p>
                      {pokemon && pokemon.currentHp !== null && pokemon.hp !== null ? (
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {t('arena.hpLabel', {
                            currentHp: pokemon.currentHp,
                            hp: pokemon.hp,
                          })}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-center rounded-[1.2rem] border border-slate-100 bg-slate-50/80 px-2 py-3">
                      {pokemon?.sprite ? (
                        <img
                          alt={pokemon.name}
                          className={cn(
                            'h-20 w-20 object-contain drop-shadow-[0_10px_14px_rgba(15,23,42,0.16)] transition',
                            pokemon.defeated ? 'grayscale opacity-45' : '',
                          )}
                          src={pokemon.sprite}
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-[1rem] border border-dashed border-slate-200 bg-white" />
                      )}
                    </div>

                    {pokemon ? (
                      <div className="flex items-center gap-2">
                        {pokemon.isActive ? (
                          <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-700">
                            {t('team.activeBadge')}
                          </span>
                        ) : null}
                        {pokemon.defeated ? (
                          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">
                            {t('team.koBadge')}
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    {pokemon && pokemon.currentHp !== null && pokemon.hp !== null ? (
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className={cn(
                            'h-2 rounded-full transition-all',
                            pokemon.defeated ? 'bg-slate-300' : 'bg-gradient-to-r from-emerald-300 to-cyan-300',
                          )}
                          style={{ width: `${Math.max(0, (pokemon.currentHp / pokemon.hp) * 100)}%` }}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </div>
      </section>
    </>
  );

  return (
    <AppShell>
      {flowState === 'battling' ? battleHud : waitingRoom}

      {activeCinematic ? (
        <div
          className={cn(
            'fixed inset-0 z-50 flex justify-center px-4',
            activeCinematic.type === 'turn-action'
              ? 'items-center bg-slate-950/58 backdrop-blur-md'
              : activeCinematic.type === 'battle-start'
                ? 'pointer-events-none items-center bg-slate-950/52 backdrop-blur-md'
                : 'items-center bg-slate-950/72 backdrop-blur-md',
          )}
        >
          {activeCinematic.type === 'match-found' || activeCinematic.type === 'team-assigned' ? (
            <button
              type="button"
              className="absolute inset-0 z-0"
              aria-label={t('cinematics.skip')}
              onClick={() => {
                setActiveCinematic(null);
              }}
            />
          ) : null}
          <div
            className={cn(
              'relative z-10 overflow-hidden text-white',
              activeCinematic.type === 'turn-action'
                ? 'w-full max-w-xl rounded-[1.6rem] border px-5 py-5 shadow-[0_30px_80px_rgba(15,23,42,0.42)] sm:rounded-[1.8rem] sm:px-6 sm:py-6'
                : 'w-full max-w-3xl rounded-[1.8rem] border border-white/12 bg-[linear-gradient(180deg,_rgba(12,18,38,0.98),_rgba(20,30,62,0.96))] px-5 py-7 shadow-[0_30px_90px_rgba(15,23,42,0.5)] sm:rounded-[2rem] sm:px-8 sm:py-10',
              activeCinematic.type === 'battle-start' ? 'pointer-events-none' : 'pointer-events-auto',
              activeCinematic.type === 'turn-action' && activeCinematic.tone === 'attack'
                ? 'border-cyan-200/70 bg-[linear-gradient(180deg,_rgba(236,254,255,0.98),_rgba(248,250,252,0.96))] text-slate-950'
                : '',
              activeCinematic.type === 'turn-action' && activeCinematic.tone === 'impact'
                ? 'border-amber-200/80 bg-[linear-gradient(180deg,_rgba(255,251,235,0.98),_rgba(255,255,255,0.96))] text-slate-950'
                : '',
              activeCinematic.type === 'turn-action' && activeCinematic.tone === 'ko'
                ? 'border-rose-200/80 bg-[linear-gradient(180deg,_rgba(255,241,242,0.98),_rgba(255,255,255,0.96))] text-slate-950'
                : '',
            )}
          >
            <div
              className={cn(
                'absolute -right-10 top-8 h-40 w-40 rounded-full',
                activeCinematic.type === 'turn-action'
                  ? 'border border-current/10 opacity-60'
                  : 'border border-cyan-300/12',
              )}
            />
            <div
              className={cn(
                'absolute -left-8 bottom-6 h-28 w-28 blur-3xl',
                activeCinematic.type === 'turn-action'
                  ? activeCinematic.tone === 'attack'
                    ? 'rounded-full bg-cyan-300/18'
                    : activeCinematic.tone === 'impact'
                      ? 'rounded-full bg-amber-300/20'
                      : 'rounded-full bg-rose-300/18'
                  : 'rounded-full bg-cyan-400/12',
              )}
            />

            {activeCinematic.type === 'turn-action' ? (
              <div className="relative space-y-4 text-center">
                <div className="flex justify-center">
                  <StatusBadge
                    label={activeCinematic.title}
                    tone={
                      activeCinematic.tone === 'attack'
                        ? 'info'
                        : activeCinematic.tone === 'ko'
                          ? 'warning'
                          : 'success'
                    }
                    className={cn(
                      activeCinematic.tone === 'attack' ? 'bg-cyan-100 text-cyan-800' : '',
                      activeCinematic.tone === 'impact' ? 'bg-amber-100 text-amber-800' : '',
                      activeCinematic.tone === 'ko' ? 'bg-rose-100 text-rose-800' : '',
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {t('cinematics.turnAction.liveLabel')}
                  </p>
                  <p className="mx-auto max-w-2xl text-xl font-semibold leading-8 text-slate-800">{activeCinematic.description}</p>
                </div>
              </div>
            ) : null}

            {activeCinematic.type === 'match-found' ? (
              <div className="space-y-6 text-center">
                <StatusBadge label={t('lobby.badges.matched')} tone="info" className="bg-cyan-300/14 text-cyan-100" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">{t('cinematics.matchFoundTitle')}</p>
                  <h2 className="mt-4 break-words text-3xl font-black tracking-tight sm:text-5xl">
                    {session?.nickname ?? t('preview.trainerFallback')}
                  </h2>
                </div>
                <div className="flex items-center justify-center gap-3 sm:gap-6">
                  <div className="h-px w-10 bg-gradient-to-r from-transparent to-cyan-300/40 sm:w-20" />
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/8 text-sm font-black uppercase tracking-[0.2em] text-cyan-100 sm:h-24 sm:w-24 sm:text-xl">
                    VS
                  </div>
                  <div className="h-px w-10 bg-gradient-to-l from-transparent to-cyan-300/40 sm:w-20" />
                </div>
                <h3 className="break-words text-3xl font-black tracking-tight text-cyan-100 sm:text-4xl">
                  {activeCinematic.opponentName}
                </h3>
                <p className="mx-auto max-w-xl text-sm text-white/70 sm:text-base">{t('cinematics.matchFoundDescription')}</p>
              </div>
            ) : null}

            {activeCinematic.type === 'team-assigned' ? (
              <div className="space-y-6 text-center">
                <StatusBadge label={t('team.actions.assigned')} tone="success" className="bg-emerald-300/16 text-emerald-100" />
                <div>
                  <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{t('cinematics.teamAssignedTitle')}</h2>
                  <p className="mt-3 text-sm text-white/70 sm:text-base">{t('cinematics.teamAssignedDescription')}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                  {activeCinematic.teamNames.map((name, index) => (
                    <div key={`${name}-${index}`} className="rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-5 sm:rounded-[1.6rem] sm:px-5 sm:py-6">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">{t('team.slotLabel', { slot: index + 1 })}</p>
                      <p className="mt-4 break-words text-xl font-black tracking-tight sm:text-2xl">{name}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-white/55">{t('cinematics.teamAssignedHint')}</p>
              </div>
            ) : null}

            {activeCinematic.type === 'battle-start' ? (
              <div className="space-y-6 text-center">
                <StatusBadge label={t('lobby.badges.battling')} tone="success" className="bg-emerald-300/16 text-emerald-100" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">{t('cinematics.battleStartTitle')}</p>
                  <div className="mt-6 grid items-center justify-items-center gap-4 md:grid-cols-[1fr_auto_1fr] md:gap-6">
                    <h2 className="break-words text-center text-3xl font-black tracking-tight sm:text-4xl md:justify-self-end md:text-right">
                      {activeCinematic.ownLabel}
                    </h2>
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/8 text-sm font-black uppercase tracking-[0.2em] text-cyan-100 sm:h-24 sm:w-24 sm:text-xl">
                      VS
                    </div>
                    <h2 className="break-words text-center text-3xl font-black tracking-tight sm:text-4xl md:justify-self-start md:text-left">
                      {activeCinematic.opponentLabel}
                    </h2>
                  </div>
                </div>
                <p className="mx-auto max-w-xl text-sm text-white/70 sm:text-base">{t('cinematics.battleStartDescription')}</p>
              </div>
            ) : null}

            {activeCinematic.type === 'battle-result' ? (
              <div className="space-y-6 text-center">
                <StatusBadge
                  label={activeCinematic.didWin ? t('cinematics.resultWinTitle') : t('cinematics.resultLoseTitle')}
                  tone={activeCinematic.didWin ? 'success' : 'warning'}
                  className={activeCinematic.didWin ? 'bg-emerald-300/16 text-emerald-100' : 'bg-amber-300/16 text-amber-100'}
                />
                <div>
                  <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
                    {activeCinematic.didWin ? t('cinematics.resultWinTitle') : t('cinematics.resultLoseTitle')}
                  </h2>
                  <p className="mx-auto mt-4 max-w-xl text-sm text-white/70 sm:text-base">
                    {battleResult?.reason === 'disconnect_timeout'
                      ? activeCinematic.didWin
                        ? t('cinematics.resultDisconnectWinDescription', { opponent: activeCinematic.opponentName })
                        : t('cinematics.resultDisconnectLoseDescription', { opponent: activeCinematic.opponentName })
                      : t('cinematics.resultDescription', { opponent: activeCinematic.opponentName })}
                  </p>
                </div>
                <div className="grid items-center justify-items-center gap-4 md:grid-cols-[1fr_auto_1fr] md:gap-6">
                  <h3 className="break-words text-center text-3xl font-black tracking-tight sm:text-4xl md:justify-self-end md:text-right">
                    {session?.nickname ?? t('preview.trainerFallback')}
                  </h3>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/8 text-sm font-black uppercase tracking-[0.2em] text-cyan-100 sm:h-24 sm:w-24 sm:text-xl">
                    VS
                  </div>
                  <h3 className="break-words text-center text-3xl font-black tracking-tight sm:text-4xl md:justify-self-start md:text-left">
                    {activeCinematic.opponentName}
                  </h3>
                </div>
                <div className="pt-2">
                  <Button
                    type="button"
                    className="min-w-40 rounded-full px-6 py-3 font-black shadow-[0_18px_34px_rgba(29,78,216,0.32)]"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleCloseBattleResult();
                    }}
                  >
                    {t('cinematics.closeResult')}
                  </Button>
                </div>
              </div>
            ) : null}

            {activeCinematic.type === 'match-found' || activeCinematic.type === 'team-assigned' ? (
              <p className="mt-8 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white/35">{t('cinematics.skip')}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {showReconnectOverlay ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/58 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,_rgba(12,18,38,0.98),_rgba(20,30,62,0.96))] px-8 py-8 text-white shadow-[0_30px_90px_rgba(15,23,42,0.5)]">
            <div className="flex items-center justify-between gap-4">
              <StatusBadge
                label={isSelfReconnectState ? t('pause.badges.self') : t('pause.badges.opponent')}
                tone={isSelfReconnectState ? 'warning' : 'info'}
                className={isSelfReconnectState ? 'bg-amber-300/16 text-amber-100' : 'bg-cyan-300/16 text-cyan-100'}
              />
              {pauseRemainingMs !== null ? (
                <span className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-bold tracking-[0.12em] text-white/90">
                  {t('pause.timerLabel')}: {formatElapsedTime(pauseRemainingMs)}
                </span>
              ) : null}
            </div>
            <div className="mt-6 space-y-3">
              <h2 className="text-4xl font-black tracking-tight">
                {isSelfReconnectState ? t('pause.selfTitle') : t('pause.opponentTitle')}
              </h2>
              <p className="text-base text-white/70">
                {isSelfReconnectState
                  ? t('pause.selfDescription')
                  : t('pause.opponentDescription', { opponent: opponent?.nickname ?? t('status.fallbackOpponent') })}
              </p>
            </div>
            {pauseRemainingMs !== null ? (
              <div className="mt-6">
                <div className="h-3 rounded-full bg-white/10">
                  <div
                    className={cn(
                      'h-3 rounded-full transition-all',
                      isSelfReconnectState ? 'bg-gradient-to-r from-amber-300 to-orange-400' : 'bg-gradient-to-r from-cyan-300 to-fuchsia-300',
                    )}
                    style={{
                      width: `${Math.max(0, Math.min(100, (pauseRemainingMs / BATTLE_RECONNECT_GRACE_MS) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
