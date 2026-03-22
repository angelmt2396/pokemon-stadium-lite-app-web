export type BattleLobbyPlayer = {
  playerId: string;
  nickname: string;
  ready: boolean;
  team: Array<{
    pokemonId: number;
    name: string;
    sprite: string;
  }>;
};

export type LobbyStatusEvent = {
  lobbyId: string;
  status: 'waiting' | 'ready' | 'battling' | 'finished';
  players: BattleLobbyPlayer[];
};

export type MatchFoundEvent = {
  lobbyId: string;
  players: BattleLobbyPlayer[];
};

export type SearchStatusEvent = {
  playerId: string;
  status: 'searching' | 'idle';
  lobbyId?: string;
  canceled?: boolean;
};

export type BattleStatePokemon = {
  pokemonId: number;
  name: string;
  sprite: string;
  hp: number;
  currentHp: number;
  attack: number;
  defense: number;
  speed: number;
  defeated: boolean;
};

export type BattleStatePlayer = {
  playerId: string;
  activePokemonIndex: number;
  activePokemon: BattleStatePokemon | null;
  team: BattleStatePokemon[];
};

export type BattleStateEvent = {
  battleId: string;
  lobbyId: string;
  status: 'battling' | 'finished';
  currentTurnPlayerId: string | null;
  players: BattleStatePlayer[];
};

export type TurnResultEvent = {
  battleId: string;
  attackerPlayerId: string;
  defenderPlayerId: string;
  attackerPokemonId: number;
  defenderPokemonId: number;
  damage: number;
  defenderRemainingHp: number;
  defenderDefeated: boolean;
  autoSwitchedPokemon: {
    playerId: string;
    activePokemonIndex: number;
    pokemon: BattleStatePokemon | null;
  } | null;
  nextTurnPlayerId: string | null;
  battleStatus: 'battling' | 'finished';
};

export type BattleEndEvent = {
  battleId: string;
  lobbyId: string;
  winnerPlayerId: string;
  status: 'finished';
};

export type AttackAckData = {
  accepted: boolean;
};

export type SearchMatchAckData = {
  playerId: string;
  reconnectToken: string;
  lobbyId: string;
  status: string;
  lobbyStatus: LobbyStatusEvent;
};

export type CancelSearchAckData = {
  playerId: string;
  canceled: boolean;
  lobbyId: string;
  lobbyStatus: LobbyStatusEvent;
};

export type AssignPokemonAckData = {
  lobbyId: string;
  playerId: string;
  team: BattleLobbyPlayer['team'];
  lobbyStatus: LobbyStatusEvent;
};

export type ReadyAckData = {
  lobbyId: string;
  playerId: string;
  ready: boolean;
  lobbyStatus: LobbyStatusEvent;
  battleStart?: BattleStateEvent | null;
};

export type ReconnectPlayerAckData = {
  playerId: string;
  lobbyId: string;
  previousSocketId: string | null;
  lobbyStatus: LobbyStatusEvent;
  battleState: BattleStateEvent | null;
};

export type SocketConnectionState = 'connecting' | 'connected' | 'disconnected';

export type BattleLobbyFlowState = 'idle' | 'searching' | 'matched' | 'battling';
