# Pokemon Stadium Lite App Web

Frontend web para `Pokemon Stadium Lite`, construido como SPA con React.

## Estado actual

Implementado actualmente:

- `Vite + React + TypeScript`
- `Tailwind CSS`
- `React Router`
- `React Query`
- `socket.io-client`
- `react-i18next`
- rutas base:
  - `/login`
  - `/`
  - `/catalog`
  - `/matchmaking`
  - `/battle`
- shell visual de home, catálogo y combate
- login ligero por nickname
- bootstrap de sesión con `sessionToken`
- guards para rutas autenticadas
- i18n con español base e inglés soportado
- configuración base para REST y Socket.IO
- catálogo consumiendo `sprite`
- flujo unificado de batalla/lobby en `/battle`
- reanudación de lobby o batalla activa
- cinemáticas de match encontrado, equipo asignado, inicio y resultado
- HUD de combate con sprites, equipo visible y estado `KO`
- pausa de combate por desconexión con countdown de 15 segundos
- reanudación automática si el jugador vuelve a tiempo
- resolución visual del resultado por `disconnect_timeout`

## Requisitos

- Node.js 20+
- npm

## Variables de entorno

Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

Variables:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

## Desarrollo local

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run typecheck
```

## Estructura base

```text
src/
  app/
  components/
  features/
  i18n/
  lib/
  pages/
  styles/
```

## Notas

- El idioma base visible es español.
- El soporte para inglés ya está preparado desde el bootstrap.
- El frontend ya arranca sobre la sesión ligera por nickname del backend.
- El login devuelve `sessionToken` y `reconnectToken`.
- El nickname sólo queda reservado mientras la sesión siga activa.
- `/matchmaking` redirige a `/battle`; la experiencia principal de combate vive en una sola pantalla.
- La búsqueda de rival solo se dispara por acción explícita del usuario:
  - click en `Jugar` desde la card de batalla en home
  - click en `Buscar rival` dentro de `/battle`
- Recargar `/battle` no debe iniciar matchmaking automáticamente.
- Si existe `currentLobbyId` o `currentBattleId`, la home muestra `Reanudar`.
- Si una batalla entra en pausa por desconexión, el frontend muestra overlay de reconexión usando `reconnectDeadlineAt`.
- Los snapshots de lobby y batalla consumen `sprite` y `team[]` completa del backend para renderizar:
  - Pokémon activos en arena
  - equipo del jugador
  - estado visual de Pokémon derrotados (`KO`)
