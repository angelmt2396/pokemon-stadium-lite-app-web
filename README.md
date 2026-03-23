# Pokemon Stadium Lite App Web

Frontend web para la prueba técnica de Pokémon Stadium Lite.

El proyecto está implementado como una SPA en TypeScript con:

- React 19 para UI
- Vite para desarrollo y build
- React Router para navegación
- Tailwind CSS para estilos
- TanStack Query para consumo REST
- Socket.IO Client para tiempo real
- `react-i18next` para internacionalización

## Estado actual

Implementado:

- `login` ligero por nickname
- restauración de sesión desde storage local con `sessionToken`
- cierre de sesión contra `DELETE /api/v1/player-sessions/me`
- guards para rutas públicas y autenticadas
- `GET /api/v1/pokemon`
- `GET /api/v1/pokemon/:id`
- catálogo con sprites consumidos desde backend
- home rediseñada como lobby principal del juego
- card de estado simplificada y orientada a jugador
- selector de idioma con banderas de México y Estados Unidos
- soporte de i18n para español e inglés
- flujo unificado de lobby y combate en `/battle`
- `/matchmaking` mantenida como ruta de compatibilidad que redirige a `/battle`
- búsqueda de rival sólo por acción explícita del usuario
- reanudación de lobby o batalla activa al volver a entrar
- cinemáticas de:
  - rival encontrado
  - equipo asignado
  - inicio de combate
  - resultado final
  - acciones de turno
- HUD de combate con:
  - sprites activos en arena
  - equipo visible por slot
  - Pokémon derrotados en estado `KO`
  - avisos visuales de ataque y daño recibido
- pausa de combate por desconexión con espera de hasta 15 segundos
- reanudación automática si el jugador vuelve a tiempo
- resultado visual cuando una batalla termina por `disconnect_timeout`

## Requisitos

- Node.js 20+
- npm
- backend de `pokemon-stadium-lite-backend` corriendo localmente

## Instalación

```bash
npm install
```

## Correr en local

1. copia `.env.example` a `.env`
2. instala dependencias
3. arranca el frontend

```bash
cp .env.example .env
npm install
npm run dev
```

La app queda disponible por defecto en:

- `http://localhost:5173`

## Docker

El frontend se puede construir como imagen estática y servirse con `nginx`.

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

La app queda disponible en:

- `http://localhost:8080`

Notas:

- el `Dockerfile` usa build multistage:
  - `node:20-alpine` para compilar
  - `nginx:alpine` para servir el build final
- `nginx.conf` incluye fallback a `index.html` para que funcionen las rutas de React Router
- `VITE_API_BASE_URL` y `VITE_SOCKET_URL` se resuelven en build time; si cambia el backend, debes reconstruir la imagen

## Variables de entorno

Usa `.env.example` como base.

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

Notas:

- `VITE_API_BASE_URL` apunta al backend HTTP
- `VITE_SOCKET_URL` apunta al mismo backend para el canal Socket.IO
- si frontend y backend corren en hosts distintos, ambos valores deben actualizarse
- en Docker, estas variables se inyectan con `--build-arg`

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run typecheck
```

## Rutas

Rutas públicas:

- `/login`

Rutas autenticadas:

- `/`
- `/catalog`
- `/battle`
- `/matchmaking` -> redirige a `/battle`

Notas:

- si existe una sesión activa con `currentLobbyId` o `currentBattleId`, el usuario puede volver directo a `/battle`
- la búsqueda de rival no se dispara al recargar la página
- la búsqueda de rival sólo puede iniciar desde:
  - el click en `Jugar` desde home
  - el click en `Buscar rival` dentro de `/battle`

## Integración con backend

REST:

- `POST /api/v1/player-sessions`
- `GET /api/v1/player-sessions/me`
- `DELETE /api/v1/player-sessions/me`
- `GET /api/v1/pokemon`
- `GET /api/v1/pokemon/:id`

Socket.IO cliente -> servidor:

- `search_match`
- `cancel_search`
- `assign_pokemon`
- `ready`
- `attack`
- `reconnect_player`

Socket.IO servidor -> cliente:

- `search_status`
- `match_found`
- `lobby_status`
- `battle_start`
- `battle_pause`
- `battle_resume`
- `turn_result`
- `battle_end`

Notas:

- el frontend persiste `sessionToken` y `reconnectToken` en storage local
- `reconnect_player` se usa para rehidratar el estado de lobby o batalla después de refresh o reconexión
- los snapshots de lobby y batalla consumen `sprite` y `team[]` completa por jugador
- `turn_result` actualiza el HUD y también dispara overlays cortos de acciones del combate
- durante una pausa por desconexión, el frontend usa `reconnectDeadlineAt` para mostrar el countdown visible

## UX actual

Home:

- hero principal con jerarquía simplificada
- navegación principal por cards de `Catálogo` y `Batalla`
- panel de estado orientado a jugador, no a backend

Catálogo:

- vista de exploración con sprites y cards de Pokémon

Combate:

- waiting room y HUD de batalla comparten la misma ruta
- el layout cambia según estado:
  - `idle`
  - `searching`
  - `matched`
  - `battling`
- los resultados y transiciones importantes se muestran como overlays

Idiomas:

- español como idioma base visible
- inglés disponible desde el selector superior

## Estructura

```txt
src/
  app/
  components/
    common/
    layout/
    ui/
  features/
    battle/
    catalog/
    health/
    matchmaking/
    session/
  i18n/
    en/
    es/
  lib/
    api/
    socket/
    storage/
    utils/
  pages/
  styles/
```

## Notas

- el nickname sólo queda reservado mientras la sesión siga activa
- si una sesión se cierra, el nickname vuelve a quedar disponible
- si el backend detecta una batalla activa o un lobby activo al restaurar sesión, el frontend intenta rehidratar el estado real antes de mostrar CTAs
- el frontend no intenta iniciar matchmaking automáticamente al montar `/battle`
- el build actual funciona correctamente; el warning pendiente de Vite está relacionado con tamaño de bundle, no con errores funcionales
