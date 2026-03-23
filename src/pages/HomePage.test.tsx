import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomePage } from '@/pages/HomePage';
import { renderWithProviders } from '@/test/test-utils';

const { useSessionMock } = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
}));

vi.mock('@/features/session/context/SessionContext', () => ({
  useSession: useSessionMock,
}));

vi.mock('@/features/catalog/components/CatalogPreviewCard', () => ({
  CatalogPreviewCard: () => <div>catalog preview card</div>,
}));

vi.mock('@/features/battle/components/BattlePreviewCard', () => ({
  BattlePreviewCard: () => <div>battle preview card</div>,
}));

vi.mock('@/features/health/components/HealthStatusCard', () => ({
  HealthStatusCard: () => <div>health status card</div>,
}));

describe('HomePage', () => {
  beforeEach(() => {
    useSessionMock.mockReset();
  });

  it('renders the home summary and preview cards for an idle session', () => {
    useSessionMock.mockReturnValue({
      session: {
        sessionToken: 'session-token',
        playerId: 'player-1',
        nickname: 'Asddf',
        playerStatus: 'idle',
        currentLobbyId: null,
        currentBattleId: null,
        reconnectToken: null,
      },
    });

    renderWithProviders(<HomePage />);

    expect(screen.getByText('Elige tu próximo movimiento')).toBeInTheDocument();
    expect(screen.getByText('Asddf')).toBeInTheDocument();
    expect(screen.getByText('Sin sala activa')).toBeInTheDocument();
    expect(screen.getByText('Arena en espera')).toBeInTheDocument();
    expect(screen.getByText('catalog preview card')).toBeInTheDocument();
    expect(screen.getByText('battle preview card')).toBeInTheDocument();
    expect(screen.getByText('health status card')).toBeInTheDocument();
  });

  it('shows the resume action when the session has active battle progress', () => {
    useSessionMock.mockReturnValue({
      session: {
        sessionToken: 'session-token',
        playerId: 'player-1',
        nickname: 'Asddf',
        playerStatus: 'battling',
        currentLobbyId: 'lobby-1',
        currentBattleId: 'battle-1',
        reconnectToken: 'reconnect-token',
      },
    });

    renderWithProviders(<HomePage />);

    expect(screen.getByRole('button', { name: 'Reanudar' })).toBeInTheDocument();
    expect(screen.getByText('Progreso pendiente')).toBeInTheDocument();
  });
});
