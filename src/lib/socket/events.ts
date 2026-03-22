export const socketEvents = {
  client: {
    searchMatch: 'search_match',
    cancelSearch: 'cancel_search',
    reconnectPlayer: 'reconnect_player',
    assignPokemon: 'assign_pokemon',
    ready: 'ready',
    attack: 'attack',
  },
  server: {
    searchStatus: 'search_status',
    matchFound: 'match_found',
    lobbyStatus: 'lobby_status',
    battleStart: 'battle_start',
    turnResult: 'turn_result',
    battleEnd: 'battle_end',
  },
} as const;

