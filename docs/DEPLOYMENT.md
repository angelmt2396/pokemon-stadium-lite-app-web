# Deployment

## Variables de entorno

El frontend depende de dos variables de build:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

Notas:

- Vite inyecta estas variables en build time
- si cambia el backend, hay que reconstruir o redeployar el frontend
- `VITE_SOCKET_URL` normalmente apunta al mismo origen del backend HTTP

## Build local

```bash
npm install
npm run build
```

Preview local:

```bash
npm run preview
```

## Docker + Nginx

El repo incluye:

- [Dockerfile](../Dockerfile)
- [nginx.conf](../nginx.conf)
- [.dockerignore](../.dockerignore)

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

La app queda servida en `http://localhost:8080`.

## Amplify

Cuando el frontend se despliega en Amplify:

- `VITE_API_BASE_URL` y `VITE_SOCKET_URL` deben definirse en los environment variables del branch/app
- después de cambiar esas variables se necesita un nuevo deploy del frontend

Uso típico:

- backend nuevo
- actualizar ambas URLs en Amplify
- redeploy del branch

## Recomendación de deployment

Si el frontend apunta a un backend público:

- usa la misma URL base para REST y socket cuando sea posible
- verifica que el backend permita el `CLIENT_ORIGIN` del frontend desplegado

## Checklist antes de publicar

- `npm test`
- `npm run build`
- validar `VITE_API_BASE_URL`
- validar `VITE_SOCKET_URL`
- confirmar que el backend permita el dominio del frontend
- revisar login, home, catálogo y batalla en el entorno desplegado
