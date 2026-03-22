export type SessionStatus = 'restoring' | 'authenticated' | 'unauthenticated';

export type SessionPayload = {
  playerId: string;
  nickname: string;
  sessionStatus: 'active' | 'closed';
  playerStatus: string;
  currentLobbyId: string | null;
  currentBattleId: string | null;
  sessionToken?: string;
};

export type SessionSnapshot = {
  sessionToken: string;
  playerId: string;
  nickname: string;
  playerStatus: string;
  currentLobbyId: string | null;
  currentBattleId: string | null;
  reconnectToken: string | null;
};

