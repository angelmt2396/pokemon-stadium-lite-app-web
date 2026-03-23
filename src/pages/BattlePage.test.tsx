import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BattlePage } from '@/pages/BattlePage';
import { renderWithProviders } from '@/test/test-utils';

const { useBattleLobbyMock, useSessionMock } = vi.hoisted(() => ({
  useBattleLobbyMock: vi.fn(),
  useSessionMock: vi.fn(),
}));

vi.mock('@/features/battle/hooks/useBattleLobby', () => ({
  useBattleLobby: useBattleLobbyMock,
}));

vi.mock('@/features/session/context/SessionContext', () => ({
  useSession: useSessionMock,
}));

vi.mock('@/components/layout/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

function createBattleLobbyMock(overrides: Record<string, unknown> = {}) {
  return {
    actionError: null,
    actionPending: false,
    attack: vi.fn().mockResolvedValue(undefined),
    activityItems: [],
    assignTeam: vi.fn().mockResolvedValue(undefined),
    battleResult: null,
    battleState: null,
    cancelSearch: vi.fn().mockResolvedValue(undefined),
    connectionState: 'connected',
    dismissBattleResult: vi.fn(),
    flowState: 'idle',
    latestTurnResult: null,
    lobbyStatus: null,
    markReady: vi.fn().mockResolvedValue(undefined),
    ownPlayer: null,
    opponent: null,
    searchElapsedMs: null,
    searchMatch: vi.fn().mockResolvedValue(undefined),
    team: [],
    ...overrides,
  };
}

describe('BattlePage', () => {
  beforeEach(() => {
    useBattleLobbyMock.mockReset();
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
    });
  });

  it('starts matchmaking from the idle waiting room CTA', async () => {
    const searchMatchMock = vi.fn().mockResolvedValue(undefined);
    useBattleLobbyMock.mockReturnValue(
      createBattleLobbyMock({
        searchMatch: searchMatchMock,
      }),
    );

    const user = userEvent.setup();

    renderWithProviders(<BattlePage />);

    await user.click(screen.getAllByRole('button', { name: 'Buscar rival' })[0]);

    expect(searchMatchMock).toHaveBeenCalled();
  });

  it('allows attacking when the battle state grants the turn to the player', async () => {
    const attackMock = vi.fn().mockResolvedValue(undefined);
    useBattleLobbyMock.mockReturnValue(
      createBattleLobbyMock({
        flowState: 'battling',
        attack: attackMock,
        ownPlayer: {
          playerId: 'player-1',
          nickname: 'Ash',
          ready: true,
          team: [],
        },
        opponent: {
          playerId: 'player-2',
          nickname: 'Gary',
          ready: true,
          team: [],
        },
        team: [
          {
            pokemonId: 25,
            name: 'Pikachu',
            sprite: 'pikachu.gif',
          },
        ],
        battleState: {
          battleId: 'battle-1',
          lobbyId: 'lobby-1',
          status: 'battling',
          currentTurnPlayerId: 'player-1',
          winnerPlayerId: null,
          disconnectedPlayerId: null,
          reconnectDeadlineAt: null,
          finishReason: null,
          players: [
            {
              playerId: 'player-1',
              activePokemonIndex: 0,
              activePokemon: {
                pokemonId: 25,
                name: 'Pikachu',
                sprite: 'pikachu.gif',
                hp: 35,
                currentHp: 35,
                attack: 55,
                defense: 40,
                speed: 90,
                defeated: false,
              },
              team: [
                {
                  pokemonId: 25,
                  name: 'Pikachu',
                  sprite: 'pikachu.gif',
                  hp: 35,
                  currentHp: 35,
                  attack: 55,
                  defense: 40,
                  speed: 90,
                  defeated: false,
                },
              ],
            },
            {
              playerId: 'player-2',
              activePokemonIndex: 0,
              activePokemon: {
                pokemonId: 1,
                name: 'Bulbasaur',
                sprite: 'bulbasaur.gif',
                hp: 45,
                currentHp: 45,
                attack: 49,
                defense: 49,
                speed: 45,
                defeated: false,
              },
              team: [
                {
                  pokemonId: 1,
                  name: 'Bulbasaur',
                  sprite: 'bulbasaur.gif',
                  hp: 45,
                  currentHp: 45,
                  attack: 49,
                  defense: 49,
                  speed: 45,
                  defeated: false,
                },
              ],
            },
          ],
        },
      }),
    );

    const user = userEvent.setup();

    renderWithProviders(<BattlePage />);

    const attackButton = screen.getAllByRole('button', { name: 'Atacar' })[0];
    expect(attackButton).toBeEnabled();

    await user.click(attackButton);

    expect(attackMock).toHaveBeenCalled();
  });

  it('shows the reconnect overlay when the opponent disconnects mid battle', () => {
    useSessionMock.mockReturnValue({
      session: {
        sessionToken: 'session-token',
        playerId: 'player-1',
        nickname: 'Ash',
        playerStatus: 'battling',
        currentLobbyId: 'lobby-1',
        currentBattleId: 'battle-1',
        reconnectToken: 'reconnect-token',
      },
    });

    useBattleLobbyMock.mockReturnValue(
      createBattleLobbyMock({
        flowState: 'battling',
        opponent: {
          playerId: 'player-2',
          nickname: 'Gary',
          ready: true,
          team: [],
        },
        battleState: {
          battleId: 'battle-1',
          lobbyId: 'lobby-1',
          status: 'paused',
          currentTurnPlayerId: null,
          winnerPlayerId: null,
          disconnectedPlayerId: 'player-2',
          reconnectDeadlineAt: new Date(Date.now() + 10_000).toISOString(),
          finishReason: null,
          players: [],
        },
      }),
    );

    renderWithProviders(<BattlePage />);

    expect(screen.getByText('Esperando reconexion rival')).toBeInTheDocument();
    expect(screen.getByText('Gary tiene hasta 15 segundos para regresar. Si no vuelve, ganas la batalla.')).toBeInTheDocument();
  });

  it('shows the disconnect win result and allows dismissing it', async () => {
    const dismissBattleResultMock = vi.fn();
    useBattleLobbyMock.mockReturnValue(
      createBattleLobbyMock({
        flowState: 'idle',
        opponent: {
          playerId: 'player-2',
          nickname: 'Gary',
          ready: true,
          team: [],
        },
        dismissBattleResult: dismissBattleResultMock,
        battleResult: {
          battleId: 'battle-1',
          lobbyId: 'lobby-1',
          winnerPlayerId: 'player-1',
          status: 'finished',
          reason: 'disconnect_timeout',
          disconnectedPlayerId: 'player-2',
        },
      }),
    );

    const user = userEvent.setup();

    renderWithProviders(<BattlePage />);

    expect(await screen.findByRole('heading', { name: 'Victoria' })).toBeInTheDocument();
    expect(screen.getByText('Gary no regresó a tiempo. La victoria fue para ti.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(dismissBattleResultMock).toHaveBeenCalled();
  });
});
