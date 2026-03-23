import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import i18n from '@/i18n';
import { server } from '@/test/msw/server';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
});

afterEach(async () => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
  window.history.pushState({}, 'Test', '/');
  await i18n.changeLanguage('es');
});

afterAll(() => {
  server.close();
});
