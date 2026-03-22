function normalizeUrl(value: string | undefined, fallback: string) {
  const source = value?.trim() || fallback;
  return source.replace(/\/$/, '');
}

export const env = {
  apiBaseUrl: normalizeUrl(import.meta.env.VITE_API_BASE_URL, 'http://localhost:3000'),
  socketUrl: normalizeUrl(import.meta.env.VITE_SOCKET_URL, 'http://localhost:3000'),
} as const;

