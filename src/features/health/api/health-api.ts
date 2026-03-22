import { apiRequest } from '@/lib/api/client';
import type { HealthStatus } from '@/features/health/types';

export function getHealthStatus() {
  return apiRequest<HealthStatus>('/health');
}

