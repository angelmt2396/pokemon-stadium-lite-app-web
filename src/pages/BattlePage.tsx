import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

type CinematicStage =
  | { id: string; type: 'match-found'; opponentName: string }
  | { id: string; type: 'team-assigned'; teamNames: string[] }
  | { id: string; type: 'battle-start'; ownLabel: string; opponentLabel: string }
  | { id: string; type: 'battle-result'; didWin: boolean; opponentName: string };

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

  if (type === 'battle-result') {
    return null;
  }

  return MATCH_FOUND_DURATION_MS;
}

function getTeamSignature(team: Array<{ pokemonId: number; name: string }>) {
  return team.map((pokemon) => pokemon.pokemonId).join(',');
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
  const {
    actionError,
    actionPending,
    attack,
    activityItems,
    battleResult,
    battleState,
    cancelSearch,
    connectionState,
    dismissBattleResult,
    flowState,
    lobbyStatus,
    ownPlayer,
    opponent,
    searchElapsedMs,
    searchMatch,
    team,
  } = useBattleLobby();
  const [cinematicQueue, setCinematicQueue] = useState<CinematicStage[]>([]);
  const [activeCinematic, setActiveCinematic] = useState<CinematicStage | null>(null);
  const locationState = (location.state ?? null) as BattleLocationState | null;

  const ownBattlePlayer =
    battleState && session ? battleState.players.find((player) => player.playerId === session.playerId) ?? null : null;
  const opponentBattlePlayer =
    battleState && session ? battleState.players.find((player) => player.playerId !== session.playerId) ?? null : null;
  const ownActivePokemon = ownBattlePlayer?.activePokemon ?? null;
  const opponentActivePokemon = opponentBattlePlayer?.activePokemon ?? null;
  const isBattleFinished = Boolean(battleResult);
  const isPlayerTurn = flowState === 'battling' && battleState?.currentTurnPlayerId === session?.playerId;
  const canAttack = Boolean(
    flowState === 'battling' &&
      ownActivePokemon &&
      !actionPending &&
      !isBattleFinished &&
      (battleState?.currentTurnPlayerId === null || battleState?.currentTurnPlayerId === session?.playerId),
  );
  const ownHpPercent = ownActivePokemon ? Math.max(8, (ownActivePokemon.currentHp / ownActivePokemon.hp) * 100) : 74;
  const opponentHpPercent = opponentActivePokemon
    ? Math.max(8, (opponentActivePokemon.currentHp / opponentActivePokemon.hp) * 100)
    : opponent
      ? 54
      : 16;
  const teamActionLabel = flowState === 'matched' && team.length === 0
    ? t('team.actions.autoAssigning')
    : flowState === 'matched' && team.length === 3 && !ownPlayer?.ready
      ? t('team.actions.autoReady')
      : isBattleFinished
        ? t('team.actions.finished')
        : ownPlayer?.ready
          ? t('team.actions.readyDone')
          : team.length === 3
            ? t('team.actions.assigned')
            : t('team.actions.waiting');
  const arenaBadgeLabel =
    isBattleFinished
      ? t('arena.finishedBadge')
      : flowState === 'battling'
        ? battleState?.currentTurnPlayerId === session?.playerId
          ? t('arena.yourTurn')
          : t('arena.opponentTurn')
        : t('arena.standbyStatus');

  const heroBadgeTone =
    flowState === 'matched' || flowState === 'battling'
      ? 'success'
      : flowState === 'searching'
        ? 'warning'
        : 'info';

  const heroBadgeLabel =
    isBattleFinished
      ? t('lobby.badges.finished')
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
        ? t('status.descriptions.won')
        : t('status.descriptions.lost')
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
        : flowState === 'battling'
          ? t('lobby.battlingTitle')
          : t('lobby.title');

  const heroDescription =
    flowState === 'searching'
      ? t('lobby.searchingDescription')
      : flowState === 'matched'
        ? t('lobby.matchedDescription')
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

  const visibleActivityItems = useMemo(() => {
    return activityItems.reduce<Array<{ id: string; message: string; count: number }>>((groups, item) => {
      const previous = groups.at(-1);

      if (previous && previous.message === item.message) {
        previous.count += 1;
        return groups;
      }

      groups.push({
        id: item.id.toString(),
        message: item.message,
        count: 1,
      });

      return groups;
    }, []).slice(0, 3);
  }, [activityItems]);

  const enqueueCinematic = useCallback((stage: CinematicStage) => {
    setCinematicQueue((current) => {
      if (current.some((item) => item.id === stage.id)) {
        return current;
      }

      return [...current, stage];
    });
  }, []);

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
    if (!initialCinematicsReadyRef.current || !battleResult?.battleId || shownBattleResultRef.current === battleResult.battleId) {
      return;
    }

    shownBattleResultRef.current = battleResult.battleId;
    enqueueCinematic({
      id: `result-${battleResult.battleId}`,
      type: 'battle-result',
      didWin: battleResult.winnerPlayerId === session?.playerId,
      opponentName: opponent?.nickname ?? t('status.fallbackOpponent'),
    });
  }, [battleResult, enqueueCinematic, opponent?.nickname, session?.playerId, t]);

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

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
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

          <Card className="game-frame border-slate-950/8 bg-white/90 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t('log.title')}</h3>
              <StatusBadge label={t('log.badge')} tone="neutral" />
            </div>
            <div className="space-y-3">
              {visibleActivityItems.length ? (
                visibleActivityItems.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 rounded-[1.3rem] border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-tide" />
                      <span>{item.message}</span>
                    </div>
                    {item.count > 1 ? (
                      <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                        {t('log.grouped', { count: item.count })}
                      </span>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-[1.3rem] border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm text-slate-600">{t('log.empty')}</div>
              )}
            </div>
          </Card>
        </div>
      </section>
    </>
  );

  const battleHud = (
    <>
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
              {isPlayerTurn ? t('lobby.yourTurnLabel') : t('lobby.opponentTurnLabel')}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
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
            <div className="rounded-[1.9rem] border border-white/8 bg-white/6 p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/45">{t('arena.playerOne')}</p>
                  <h4 className="mt-3 text-2xl font-bold">{ownActivePokemon?.name ?? session?.nickname ?? t('arena.playerOnePokemon')}</h4>
                  <p className="mt-2 text-sm text-white/60">
                    {ownActivePokemon
                      ? t('arena.hpLabel', {
                          currentHp: ownActivePokemon.currentHp,
                          hp: ownActivePokemon.hp,
                        })
                      : t('arena.waitingStart')}
                  </p>
                </div>
                {ownActivePokemon?.sprite ? (
                  <img
                    alt={ownActivePokemon.name}
                    className={cn(
                      'h-28 w-28 shrink-0 object-contain drop-shadow-[0_16px_24px_rgba(34,211,238,0.2)] transition',
                      ownActivePokemon.defeated ? 'grayscale opacity-45' : '',
                    )}
                    src={ownActivePokemon.sprite}
                  />
                ) : null}
              </div>
              <div className="mt-5 h-3 rounded-full bg-white/10">
                <div className="h-3 rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300 transition-all" style={{ width: `${ownHpPercent}%` }} />
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
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/45">{t('arena.playerTwo')}</p>
                  <h4 className="mt-3 text-2xl font-bold">{opponentActivePokemon?.name ?? opponent?.nickname ?? t('arena.unknownOpponent')}</h4>
                  <p className="mt-2 text-sm text-white/60">
                    {opponentActivePokemon
                      ? t('arena.hpLabel', {
                          currentHp: opponentActivePokemon.currentHp,
                          hp: opponentActivePokemon.hp,
                        })
                      : t('arena.waitingStart')}
                  </p>
                </div>
                {opponentActivePokemon?.sprite ? (
                  <img
                    alt={opponentActivePokemon.name}
                    className={cn(
                      'h-28 w-28 shrink-0 object-contain drop-shadow-[0_16px_24px_rgba(217,70,239,0.2)] transition',
                      opponentActivePokemon.defeated ? 'grayscale opacity-45' : '',
                    )}
                    src={opponentActivePokemon.sprite}
                  />
                ) : null}
              </div>
              <div className="mt-5 h-3 rounded-full bg-white/10">
                <div className="h-3 rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-300 transition-all" style={{ width: `${opponentHpPercent}%` }} />
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-6 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div className="rounded-[1.4rem] border border-white/8 bg-white/8 px-4 py-4">
              <p className="text-sm font-medium text-white/78">
                {isBattleFinished
                  ? battleResult?.winnerPlayerId === session?.playerId
                    ? t('arena.result.win')
                    : t('arena.result.lose')
                  : canAttack
                    ? t('arena.attackReady')
                    : t('arena.waitingTurnState')}
              </p>
            </div>
            <Button
              type="button"
              className="relative z-10 min-h-12 rounded-2xl px-5 py-3 font-black"
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
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t('team.slotLabel', { slot: index + 1 })}</p>
                      <p className="mt-3 text-base font-bold text-ink">{pokemon?.name ?? t('team.slotWaiting')}</p>
                      {pokemon && pokemon.currentHp !== null && pokemon.hp !== null ? (
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {t('arena.hpLabel', {
                            currentHp: pokemon.currentHp,
                            hp: pokemon.hp,
                          })}
                        </p>
                      ) : null}
                    </div>
                    {pokemon?.sprite ? (
                      <img
                        alt={pokemon.name}
                        className={cn(
                          'h-16 w-16 shrink-0 object-contain drop-shadow-[0_10px_14px_rgba(15,23,42,0.16)] transition',
                          pokemon.defeated ? 'grayscale opacity-45' : '',
                        )}
                        src={pokemon.sprite}
                      />
                    ) : null}
                  </div>
                  {pokemon ? (
                    <div className="mt-4 space-y-3">
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
                      {pokemon.currentHp !== null && pokemon.hp !== null ? (
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
                  ) : null}
                </div>
              ))}
            </div>
          </Card>

          <Card className="game-frame border-slate-950/8 bg-white/90 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t('log.title')}</h3>
              <StatusBadge label={t('log.badge')} tone="neutral" />
            </div>
            <div className="space-y-3">
              {visibleActivityItems.length ? (
                visibleActivityItems.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 rounded-[1.3rem] border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-tide" />
                      <span>{item.message}</span>
                    </div>
                    {item.count > 1 ? (
                      <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                        {t('log.grouped', { count: item.count })}
                      </span>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-[1.3rem] border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm text-slate-600">{t('log.empty')}</div>
              )}
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
          className={`fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-md ${
            activeCinematic.type === 'battle-start' ? 'pointer-events-none bg-slate-950/52' : 'bg-slate-950/72'
          }`}
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
            className={`relative z-10 w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,_rgba(12,18,38,0.98),_rgba(20,30,62,0.96))] px-8 py-10 text-white shadow-[0_30px_90px_rgba(15,23,42,0.5)] ${
              activeCinematic.type === 'battle-start' ? 'pointer-events-none' : 'pointer-events-auto'
            }`}
          >
            <div className="absolute -right-10 top-8 h-40 w-40 rounded-full border border-cyan-300/12" />
            <div className="absolute -left-8 bottom-6 h-28 w-28 rounded-full bg-cyan-400/12 blur-3xl" />

            {activeCinematic.type === 'match-found' ? (
              <div className="space-y-6 text-center">
                <StatusBadge label={t('lobby.badges.matched')} tone="info" className="bg-cyan-300/14 text-cyan-100" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">{t('cinematics.matchFoundTitle')}</p>
                  <h2 className="mt-4 text-5xl font-black tracking-tight">{session?.nickname ?? t('preview.trainerFallback')}</h2>
                </div>
                <div className="flex items-center justify-center gap-6">
                  <div className="h-px w-20 bg-gradient-to-r from-transparent to-cyan-300/40" />
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/8 text-xl font-black uppercase tracking-[0.2em] text-cyan-100">
                    VS
                  </div>
                  <div className="h-px w-20 bg-gradient-to-l from-transparent to-cyan-300/40" />
                </div>
                <h3 className="text-4xl font-black tracking-tight text-cyan-100">{activeCinematic.opponentName}</h3>
                <p className="mx-auto max-w-xl text-base text-white/70">{t('cinematics.matchFoundDescription')}</p>
              </div>
            ) : null}

            {activeCinematic.type === 'team-assigned' ? (
              <div className="space-y-6 text-center">
                <StatusBadge label={t('team.actions.assigned')} tone="success" className="bg-emerald-300/16 text-emerald-100" />
                <div>
                  <h2 className="text-4xl font-black tracking-tight">{t('cinematics.teamAssignedTitle')}</h2>
                  <p className="mt-3 text-base text-white/70">{t('cinematics.teamAssignedDescription')}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {activeCinematic.teamNames.map((name, index) => (
                    <div key={`${name}-${index}`} className="rounded-[1.6rem] border border-white/10 bg-white/6 px-5 py-6">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">{t('team.slotLabel', { slot: index + 1 })}</p>
                      <p className="mt-4 text-2xl font-black tracking-tight">{name}</p>
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
                  <div className="mt-6 grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
                    <h2 className="text-4xl font-black tracking-tight text-right">{activeCinematic.ownLabel}</h2>
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/8 text-xl font-black uppercase tracking-[0.2em] text-cyan-100">
                      VS
                    </div>
                    <h2 className="text-4xl font-black tracking-tight text-left">{activeCinematic.opponentLabel}</h2>
                  </div>
                </div>
                <p className="mx-auto max-w-xl text-base text-white/70">{t('cinematics.battleStartDescription')}</p>
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
                  <h2 className="text-5xl font-black tracking-tight">
                    {activeCinematic.didWin ? t('cinematics.resultWinTitle') : t('cinematics.resultLoseTitle')}
                  </h2>
                  <p className="mx-auto mt-4 max-w-xl text-base text-white/70">
                    {t('cinematics.resultDescription', { opponent: activeCinematic.opponentName })}
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
                  <h3 className="text-4xl font-black tracking-tight text-right">{session?.nickname ?? t('preview.trainerFallback')}</h3>
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/8 text-xl font-black uppercase tracking-[0.2em] text-cyan-100">
                    VS
                  </div>
                  <h3 className="text-4xl font-black tracking-tight text-left">{activeCinematic.opponentName}</h3>
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
    </AppShell>
  );
}
