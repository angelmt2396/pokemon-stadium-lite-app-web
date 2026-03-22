export const sessionStorageKeys = {
  sessionToken: 'pokemon-stadium-lite-session-token',
  playerId: 'pokemon-stadium-lite-player-id',
  nickname: 'pokemon-stadium-lite-nickname',
  reconnectToken: 'pokemon-stadium-lite-reconnect-token',
  lobbyId: 'pokemon-stadium-lite-lobby-id',
  battleId: 'pokemon-stadium-lite-battle-id',
} as const;

export type PersistedSession = {
  sessionToken: string | null;
  playerId: string | null;
  nickname: string | null;
  reconnectToken: string | null;
  lobbyId: string | null;
  battleId: string | null;
};

export function readPersistedSession(): PersistedSession {
  return {
    sessionToken: localStorage.getItem(sessionStorageKeys.sessionToken),
    playerId: localStorage.getItem(sessionStorageKeys.playerId),
    nickname: localStorage.getItem(sessionStorageKeys.nickname),
    reconnectToken: localStorage.getItem(sessionStorageKeys.reconnectToken),
    lobbyId: localStorage.getItem(sessionStorageKeys.lobbyId),
    battleId: localStorage.getItem(sessionStorageKeys.battleId),
  };
}

export function persistSession(values: Partial<PersistedSession>) {
  const entries = Object.entries(values) as Array<[keyof PersistedSession, string | null | undefined]>;

  for (const [key, value] of entries) {
    const storageKey = sessionStorageKeys[key];

    if (value === undefined) {
      continue;
    }

    if (value === null || value === '') {
      localStorage.removeItem(storageKey);
      continue;
    }

    localStorage.setItem(storageKey, value);
  }
}

export function clearPersistedSession() {
  for (const storageKey of Object.values(sessionStorageKeys)) {
    localStorage.removeItem(storageKey);
  }
}

