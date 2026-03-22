import { apiRequest } from '@/lib/api/client';
import type { SessionPayload } from '@/features/session/types';

type CreateSessionRequest = {
  nickname: string;
};

type CloseSessionResponse = {
  closed: boolean;
};

export function createNicknameSession(body: CreateSessionRequest) {
  return apiRequest<SessionPayload>('/api/v1/player-sessions', {
    method: 'POST',
    body,
  });
}

export function getCurrentNicknameSession(token: string) {
  return apiRequest<SessionPayload>('/api/v1/player-sessions/me', {
    token,
  });
}

export function closeNicknameSession(token: string) {
  return apiRequest<CloseSessionResponse>('/api/v1/player-sessions/me', {
    method: 'DELETE',
    token,
  });
}

