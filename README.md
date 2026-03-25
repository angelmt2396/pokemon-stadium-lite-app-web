# Pokemon Stadium Lite App Web

SPA de frontend para `Pokemon Stadium Lite`, orientada a login ligero por nickname, catálogo de Pokémon y flujo de batalla en tiempo real.

## Stack

- React 19
- Vite
- TypeScript
- React Router
- TanStack Query
- Socket.IO Client
- Tailwind CSS
- `react-i18next`
- Vitest + Testing Library

## Lo más importante

- sesión por nickname con restore desde storage local
- catálogo conectado al backend
- home como lobby principal del juego
- flujo unificado de espera y combate en `/battle`
- reconexión de batalla y pausa por desconexión
- soporte i18n para español e inglés
- layout responsive para móvil y desktop
- base de tests para sesión, routing, home y batalla

## Requisitos

- Node.js 20+
- npm
- backend de `pokemon-stadium-lite-backend`

## Instalación

```bash
cp .env.example .env
npm install
```

## Variables de entorno

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

- `VITE_API_BASE_URL` apunta al backend HTTP
- `VITE_SOCKET_URL` apunta al backend de Socket.IO
- ambas variables se resuelven en build time

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run typecheck
npm test
npm run test:watch
npm run test:coverage
```

## Correr en local

```bash
npm run dev
```

La app queda disponible en `http://localhost:5173`.

## Docker

Build:

```bash
docker build \
  --build-arg VITE_API_BASE_URL=http://localhost:3000 \
  --build-arg VITE_SOCKET_URL=http://localhost:3000 \
  -t pokemon-stadium-lite-app-web .
```

Run:

```bash
docker run --rm -p 8080:80 pokemon-stadium-lite-app-web
```

La app queda disponible en `http://localhost:8080`.

## Rutas

Públicas:

- `/login`

Protegidas:

- `/`
- `/catalog`
- `/battle`
- `/matchmaking` redirige a `/battle`

## Integración con backend

REST:

- `POST /api/v1/player-sessions`
- `GET /api/v1/player-sessions/me`
- `DELETE /api/v1/player-sessions/me`
- `GET /api/v1/pokemon`
- `GET /api/v1/pokemon/:id`

Tiempo real:

- cliente -> servidor:
  - `search_match`
  - `cancel_search`
  - `assign_pokemon`
  - `ready`
  - `attack`
  - `reconnect_player`
- servidor -> cliente:
  - `search_status`
  - `match_found`
  - `lobby_status`
  - `battle_start`
  - `battle_pause`
  - `battle_resume`
  - `turn_result`
  - `battle_end`

## Estructura

```txt
src/
  app/
  components/
  features/
  i18n/
  lib/
  pages/
  styles/
  test/
docs/
```

## Documentación

- [Arquitectura](docs/ARCHITECTURE.md)
- [Flujo de Batalla](docs/BATTLE-FLOW.md)
- [Testing](docs/TESTING.md)
- [Deployment](docs/DEPLOYMENT.md)

## Notas operativas

- el nickname sólo queda reservado mientras la sesión esté activa
- si la pestaña se cierra con la sesión en `idle` y sin lobby/batalla, el frontend intenta cerrar la sesión para liberar el nickname
- si la sesión expira o el backend responde `Invalid or expired session token`, el frontend limpia storage local y regresa a login
- si existe `currentLobbyId` o `currentBattleId` junto con `reconnectToken`, `/battle` intenta rehidratar la sesión en tiempo real al entrar
- `/battle` no inicia matchmaking automáticamente al montar la página
- el build actual funciona correctamente; el warning pendiente de Vite sigue relacionado con tamaño de bundle
