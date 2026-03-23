# Testing

## Stack actual

El frontend usa:

- Vitest
- Testing Library
- `@testing-library/jest-dom`
- JSDOM
- MSW

Configuración principal:

- [vite.config.ts](../vite.config.ts)
- [setup.ts](../src/test/setup.ts)
- [test-utils.tsx](../src/test/test-utils.tsx)

## Scripts

```bash
npm test
npm run test:watch
npm run test:coverage
```

## Qué cubren hoy los tests

### Sesión

- restore de sesión persistida
- login
- logout
- persistencia y limpieza de storage

Archivo:

- [SessionContext.test.tsx](../src/features/session/context/SessionContext.test.tsx)

### Routing

- `ProtectedRoute`
- `GuestRoute`

Archivos:

- [ProtectedRoute.test.tsx](../src/features/session/components/ProtectedRoute.test.tsx)
- [GuestRoute.test.tsx](../src/features/session/components/GuestRoute.test.tsx)

### Páginas base

- login
- home
- app shell

Archivos:

- [LoginPage.test.tsx](../src/pages/LoginPage.test.tsx)
- [HomePage.test.tsx](../src/pages/HomePage.test.tsx)
- [AppShell.test.tsx](../src/components/layout/AppShell.test.tsx)

### Batalla

Cobertura actual visible de producto:

- CTA de búsqueda en waiting room
- botón de ataque habilitado en turno válido
- overlay de pausa por desconexión
- resultado final por `disconnect_timeout`

Archivo:

- [BattlePage.test.tsx](../src/pages/BattlePage.test.tsx)

## Filosofía actual

La estrategia prioriza:

- comportamiento visible
- flujos críticos de producto
- mocks de sesión y hooks complejos

No intenta todavía:

- testear cada componente visual pequeño
- montar sockets reales en unit/integration tests
- cubrir toda la UI decorativa

## MSW

MSW ya está sembrado como base para crecimiento futuro:

- [handlers.ts](../src/test/msw/handlers.ts)
- [server.ts](../src/test/msw/server.ts)

Hoy se usa como infraestructura disponible más que como capa central de los tests.

## Qué falta

Las siguientes áreas siguen siendo las prioridades naturales:

- [useBattleLobby.ts](../src/features/battle/hooks/useBattleLobby.ts)
- [CatalogPage.tsx](../src/pages/CatalogPage.tsx)
- [HealthStatusCard.tsx](../src/features/health/components/HealthStatusCard.tsx)
- e2e con Playwright

## Recomendaciones al agregar tests nuevos

- preferir tests de comportamiento, no snapshots grandes
- mockear hooks complejos cuando el objetivo sea validar render/flujo
- usar `renderWithProviders` para evitar boilerplate
- mantener i18n en español como base estable de assertions
- si un cambio grande toca sesión o batalla, correr `npm test` antes de cerrar
