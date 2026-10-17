# Práctica 03: Backend MEAN

API REST de gestión de empleados con Node.js, Express, TypeScript, MongoDB y Zod. Aplica Repository, validación DTO y respuestas uniformes.

## Ejecución

Requiere Node.js 20+, npm y MongoDB local o Atlas.

```powershell
cd backend
npm ci
npm run build
npm start
```

Para desarrollo: `npm run dev`. El servidor escucha en `http://localhost:3000` después de conectar a MongoDB.

Por defecto usa `mongodb://127.0.0.1:27017/usuarios_db`. Las opciones están en `backend/.env.example`. Para cambiarlas, definir `$env:MONGO_URI` y `$env:PORT` en PowerShell antes de iniciar. El servidor no carga archivos `.env` automáticamente.

## API

Base: `/api/v1/employees` (alias `/api/v1/empleados`). Admite GET de lista completa o paginada (`?page=1&limit=10`), GET por ID, POST, PUT, PATCH y DELETE.

Campos: `nombre`, `cargo`, `departamento` y `sueldo`. Los ejemplos están en `backend/api.rest`.

## Estructura y pruebas

`backend/src` separa dominio, repositorios, DTO, middleware, controladores y rutas. `backend/test` contiene las pruebas HTTP con repositorio en memoria.

```powershell
cd backend
npm test
```

Las pruebas no sustituyen la integración con MongoDB.

## Informe

Ver [informe de la práctica y captura](../PRACTICA.md).
