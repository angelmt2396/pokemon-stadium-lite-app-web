# Pokemon Stadium Lite App Web

Frontend web para `Pokemon Stadium Lite`, construido como SPA con React.

## Estado actual

Fase 1 implementada:

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
- shell visual inicial
- login ligero por nickname
- bootstrap de sesión con `sessionToken`
- guards para rutas autenticadas
- i18n con español base e inglés soportado
- configuración base para REST y Socket.IO

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

- El código interno está en inglés.
- El idioma base visible es español.
- El soporte para inglés ya está preparado desde el bootstrap.
- El frontend ya arranca sobre la sesión ligera por nickname del backend.
- Las siguientes fases conectarán matchmaking, catálogo y batalla sobre esta base autenticada.
