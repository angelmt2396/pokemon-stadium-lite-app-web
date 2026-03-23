# Battle Flow

## Objetivo

El frontend concentra el matchmaking, el lobby y la batalla en una sola ruta:

- `/battle`

La UI cambia de layout y comportamiento según el estado que devuelve el hook [useBattleLobby.ts](../src/features/battle/hooks/useBattleLobby.ts).

## Estados principales

### `idle`

El jugador aún no está buscando rival.

La pantalla muestra:

- CTA principal para `Buscar rival`
- resumen de estado
- preview de arena/equipo

### `searching`

La cola está activa.

La pantalla muestra:

- estado de búsqueda
- tiempo transcurrido
- CTA para cancelar

Reglas:

- la búsqueda sólo inicia por acción explícita
- no se reinicia al refrescar la página
- se corta automáticamente después de 3 minutos

### `matched`

Se encontró rival y la arena está preparando el combate.

La pantalla muestra:

- resumen del rival
- reveal de equipo
- transición a batalla

### `battling`

La batalla ya está activa.

La pantalla muestra:

- HUD de combate
- Pokémon activos
- equipo por slot
- CTA de ataque según turno
- overlays de acciones y resultados

## Cinemáticas y overlays

[BattlePage.tsx](../src/pages/BattlePage.tsx) maneja una cola de cinemáticas con etapas como:

- `match-found`
- `team-assigned`
- `battle-start`
- `turn-action`
- `battle-result`

Estas capas sirven para:

- dar feedback del flujo del juego
- evitar que el combate se sienta como dashboard
- comunicar acciones críticas sin depender sólo de texto inline

## Reconexión

Si una batalla se pausa por desconexión:

- el backend envía el estado pausado
- el frontend muestra un overlay de reconexión
- se usa `reconnectDeadlineAt` para mostrar la cuenta regresiva

Escenarios:

- si vuelve el jugador desconectado antes del límite, la batalla continúa
- si no vuelve, el backend termina la batalla por `disconnect_timeout`

## Resultado final

El resultado se muestra con un overlay dedicado.

Casos contemplados:

- victoria por daño
- derrota por daño
- victoria por desconexión del rival
- derrota por no reconectar a tiempo

El cierre del resultado requiere acción explícita del usuario.

## Datos consumidos por el HUD

El frontend usa snapshots de lobby y batalla que incluyen:

- `sprite`
- equipo completo por jugador
- Pokémon activo
- HP actual
- estado `defeated`

Eso permite:

- renderizar sprites activos
- marcar `KO`
- resaltar el slot activo

## Eventos de tiempo real

Cliente -> servidor:

- `search_match`
- `cancel_search`
- `assign_pokemon`
- `ready`
- `attack`
- `reconnect_player`

Servidor -> cliente:

- `search_status`
- `match_found`
- `lobby_status`
- `battle_start`
- `battle_pause`
- `battle_resume`
- `turn_result`
- `battle_end`

## Puntos delicados

Conviene validar con cuidado cuando se toque:

- arranque manual de matchmaking
- restore al refrescar
- overlays no bloqueantes vs bloqueantes
- habilitación del botón `Atacar`
- resolución visual del resultado final
