import { useQuery } from '@tanstack/react-query';
import { getHealthStatus } from '@/features/health/api/health-api';

export function useHealthStatus() {
  return useQuery({
    queryKey: ['health-status'],
    queryFn: getHealthStatus,
    staleTime: 30_000,
  });
}

