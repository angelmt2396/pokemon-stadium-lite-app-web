import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useBattleLobby } from '@/features/battle/hooks/useBattleLobby';
import { useSession } from '@/features/session/context/SessionContext';

export function BattlePage() {
  const { t } = useTranslation('battle');
  const { session } = useSession();
  const autoSearchHandledRef = useRef(false);
  const {
    actionError,
    actionPending,
    activityItems,
    battleState,
    connectionState,
    flowState,
    lobbyStatus,
    ownPlayer,
    opponent,
    searchMatch,
    team,
  } = useBattleLobby();
  const ownBattlePlayer =
    battleState && session ? battleState.players.find((player) => player.playerId === session.playerId) ?? null : null;
  const opponentBattlePlayer =
    battleState && session ? battleState.players.find((player) => player.playerId !== session.playerId) ?? null : null;
  const ownActivePokemon = ownBattlePlayer?.activePokemon ?? null;
  const opponentActivePokemon = opponentBattlePlayer?.activePokemon ?? null;
  const ownHpPercent = ownActivePokemon ? Math.max(8, (ownActivePokemon.currentHp / ownActivePokemon.hp) * 100) : 74;
  const opponentHpPercent = opponentActivePokemon
    ? Math.max(8, (opponentActivePokemon.currentHp / opponentActivePokemon.hp) * 100)
    : opponent
      ? 54
      : 18;
  const teamActionLabel = flowState === 'matched' && team.length === 0
    ? t('team.actions.autoAssigning')
    : flowState === 'matched' && team.length === 3 && !ownPlayer?.ready
      ? t('team.actions.autoReady')
      : ownPlayer?.ready
        ? t('team.actions.readyDone')
        : team.length === 3
          ? t('team.actions.assigned')
          : t('team.actions.waiting');
  const arenaBadgeLabel =
    flowState === 'battling'
      ? battleState?.currentTurnPlayerId === session?.playerId
        ? t('arena.yourTurn')
        : t('arena.opponentTurn')
      : t('arena.readyBadge');

  const heroBadgeTone =
    flowState === 'matched' || flowState === 'battling'
      ? 'success'
      : flowState === 'searching'
        ? 'warning'
        : 'info';

  const heroBadgeLabel =
    flowState === 'matched'
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
    flowState === 'matched'
      ? t('status.descriptions.matched', { nickname: opponent?.nickname ?? t('status.fallbackOpponent') })
      : flowState === 'battling'
        ? t('status.descriptions.battling')
        : flowState === 'searching'
        ? t('status.descriptions.searching')
        : t('status.descriptions.idle');

  useEffect(() => {
    if (autoSearchHandledRef.current) {
      return;
    }

    if (flowState !== 'idle' || actionPending) {
      return;
    }

    autoSearchHandledRef.current = true;
    void searchMatch();
  }, [actionPending, flowState, searchMatch]);

  return (
    <AppShell>
      <section className="mb-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="game-frame relative overflow-hidden px-6 py-7 md:px-8 md:py-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[-18px] top-[-18px] h-28 w-28 rounded-full border border-white/20 bg-white/8"
          />
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge label={heroBadgeLabel} tone={heroBadgeTone} />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {t('lobby.player', { nickname: session?.nickname ?? 'Trainer' })}
              </span>
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-black tracking-tight md:text-5xl">{t('lobby.title')}</h2>
              <p className="max-w-2xl text-base text-slate-600 md:text-lg">{statusDescription}</p>
            </div>
            {flowState === 'searching' ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                {t('lobby.autoSearching')}
              </div>
            ) : null}
            {actionError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                {actionError}
              </div>
            ) : null}
          </div>
        </div>

        <Card className="game-frame space-y-4 border-slate-950/8 bg-white/90">
          <StatusBadge label={connectionLabel} tone={connectionTone} />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{t('status.title')}</h3>
            <p className="text-sm text-slate-500">{statusDescription}</p>
          </div>
          <div className="space-y-3">
            <div className="h-3 rounded-full bg-slate-100">
              <div
                className="h-3 rounded-full bg-tide transition-all"
                style={{
                  width:
                    flowState === 'matched'
                      ? '78%'
                      : flowState === 'searching'
                        ? '45%'
                        : flowState === 'battling'
                          ? '100%'
                          : '18%',
                }}
              />
            </div>
            <div className="grid gap-2">
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{t('status.stepOne')}</div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {lobbyStatus?.lobbyId ? t('status.lobbyId', { lobbyId: lobbyStatus.lobbyId }) : t('status.noLobby')}
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {opponent ? t('status.opponent', { nickname: opponent.nickname }) : t('status.waitingOpponent')}
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {t('status.youReady', {
                  status: ownPlayer?.ready ? t('status.readyStates.ready') : t('status.readyStates.pending'),
                })}
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {t('status.opponentReady', {
                  status: opponent?.ready ? t('status.readyStates.ready') : t('status.readyStates.pending'),
                })}
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="game-frame border-slate-950/8 bg-[linear-gradient(160deg,_rgba(8,12,34,0.98),_rgba(19,30,61,0.92))] text-white">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">{t('arena.kicker')}</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight">{t('arena.title')}</h3>
            </div>
            <StatusBadge
              label={arenaBadgeLabel}
              tone="info"
              className="bg-white/10 text-white"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="rounded-[1.75rem] bg-white/6 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-white/45">{t('arena.playerOne')}</p>
              <h4 className="mt-2 text-2xl font-bold">{ownActivePokemon?.name ?? session?.nickname ?? t('arena.playerOnePokemon')}</h4>
              <p className="mt-1 text-sm text-white/60">
                {ownActivePokemon
                  ? t('arena.hpLabel', {
                      currentHp: ownActivePokemon.currentHp,
                      hp: ownActivePokemon.hp,
                    })
                  : t('arena.waitingStart')}
              </p>
              <div className="mt-4 h-3 rounded-full bg-white/10">
                <div className="h-3 rounded-full bg-emerald-400 transition-all" style={{ width: `${ownHpPercent}%` }} />
              </div>
            </div>
            <div className="flex justify-center">
              <div className="rounded-full border border-white/12 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-white/65">
                VS
              </div>
            </div>
            <div className="rounded-[1.75rem] bg-white/8 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-white/45">{t('arena.playerTwo')}</p>
              <h4 className="mt-2 text-2xl font-bold">{opponentActivePokemon?.name ?? opponent?.nickname ?? t('arena.playerTwoPokemon')}</h4>
              <p className="mt-1 text-sm text-white/60">
                {opponentActivePokemon
                  ? t('arena.hpLabel', {
                      currentHp: opponentActivePokemon.currentHp,
                      hp: opponentActivePokemon.hp,
                    })
                  : t('arena.waitingStart')}
              </p>
              <div className="mt-4 h-3 rounded-full bg-white/10">
                <div
                  className={`h-3 rounded-full transition-all ${opponent ? 'bg-amber-300' : 'bg-white/30'}`}
                  style={{ width: `${opponentHpPercent}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6">
          <Card className="game-frame border-slate-950/8 bg-white/90">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t('team.title')}</h3>
              <Button
                variant="secondary"
                className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em]"
                disabled
              >
                {teamActionLabel}
              </Button>
            </div>
            <div className="grid gap-3">
              {team.length ? (
                team.map((pokemon) => (
                  <div key={pokemon.pokemonId} className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">
                    {pokemon.name}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">{t('team.empty')}</div>
              )}
            </div>
          </Card>

          <Card className="game-frame border-slate-950/8 bg-white/90">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t('log.title')}</h3>
              <StatusBadge label={t('log.badge')} tone="neutral" />
            </div>
            <div className="space-y-3">
              {activityItems.length ? (
                activityItems.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {item.message}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{t('log.empty')}</div>
              )}
            </div>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
