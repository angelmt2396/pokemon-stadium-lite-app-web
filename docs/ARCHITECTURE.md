# Frontend Architecture

## Objetivo

Este frontend está organizado por capas para separar:

- composición global de la app
- lógica de negocio por feature
- utilidades compartidas
- UI reutilizable

La meta es que el flujo de juego viva en `features/` y que `pages/` sólo ensamblen pantallas.

## Estructura principal

```txt
src/
  app/
    providers.tsx
    router.tsx
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
    env/
    socket/
    storage/
    utils/
  pages/
  styles/
  test/
```

## Responsabilidades por carpeta

### `src/app`

- define providers globales
- configura el router principal
- conecta sesión, query client y layout general

Archivos clave:

- [providers.tsx](../src/app/providers.tsx)
- [router.tsx](../src/app/router.tsx)

### `src/components`

Contiene piezas compartidas entre features.

- `layout/`: shell, header, selector de idioma
- `ui/`: botón, input, card, badge
- `common/`: piezas reutilizables no estrictamente de negocio

Regla:
- si un componente se usa sólo en una feature, debería vivir en `features/<feature>/components`

### `src/features`

Aquí vive la lógica funcional del producto.

#### `session`

- login/logout
- restauración de sesión
- guards de ruta
- integración con `player-sessions`

Archivos clave:

- [SessionContext.tsx](../src/features/session/context/SessionContext.tsx)
- [ProtectedRoute.tsx](../src/features/session/components/ProtectedRoute.tsx)
- [GuestRoute.tsx](../src/features/session/components/GuestRoute.tsx)

#### `battle`

- matchmaking
- lobby
- batalla activa
- reconexión
- overlays/cinemáticas

Archivos clave:

- [useBattleLobby.ts](../src/features/battle/hooks/useBattleLobby.ts)
- [types.ts](../src/features/battle/types.ts)
- [BattlePreviewCard.tsx](../src/features/battle/components/BattlePreviewCard.tsx)

#### `catalog`

- listado de Pokémon
- detalle
- preview de home

#### `health`

- estado del backend
- card de disponibilidad del juego

### `src/i18n`

Toda la traducción vive aquí, separada por idioma y namespace.

Namespaces actuales:

- `common`
- `login`
- `home`
- `catalog`
- `matchmaking`
- `battle`

Regla:
- nuevo copy de producto debe pasar por i18n

### `src/lib`

Infraestructura compartida:

- `api/`: cliente HTTP
- `socket/`: cliente Socket.IO, eventos y tipos base
- `storage/`: persistencia en `localStorage`
- `utils/`: helpers puros

### `src/pages`

Ensamblan pantallas de alto nivel:

- [LoginPage.tsx](../src/pages/LoginPage.tsx)
- [HomePage.tsx](../src/pages/HomePage.tsx)
- [CatalogPage.tsx](../src/pages/CatalogPage.tsx)
- [BattlePage.tsx](../src/pages/BattlePage.tsx)

Regla:
- la página decide layout y composición
- la lógica reusable debe bajar a hooks o features

## Providers globales

La app se monta con:

- `QueryClientProvider`
- `SessionProvider`
- `RouterProvider`

Esto permite que sesión, networking y navegación estén disponibles en todo el árbol.

## Estado de sesión

`SessionProvider` es la fuente de verdad del estado autenticado del frontend.

Expone:

- `status`
- `session`
- `errorMessage`
- `login`
- `logout`
- `clearSessionError`
- `updateRuntimeSession`

Persistencia local:

- `sessionToken`
- `playerId`
- `nickname`
- `reconnectToken`
- `lobbyId`
- `battleId`

## Decisiones de arquitectura

- sesión ligera por nickname, no cuentas completas
- layout responsive con variantes por breakpoint, sin duplicar pantallas enteras
- flujo de combate centralizado en `useBattleLobby`
- componentes visuales desacoplados de la capa de socket cuando es posible
- i18n como requisito de UI, no como mejora opcional

## Áreas delicadas

Las zonas con más complejidad y mayor riesgo de regresión son:

- [SessionContext.tsx](../src/features/session/context/SessionContext.tsx)
- [useBattleLobby.ts](../src/features/battle/hooks/useBattleLobby.ts)
- [BattlePage.tsx](../src/pages/BattlePage.tsx)

Cuando se modifiquen estas zonas conviene:

- correr tests
- validar móvil y desktop
- revisar restore/reconnect de sesión
