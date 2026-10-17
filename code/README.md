# Práctica 03: Backend MEAN

API REST de gestión de empleados con Node.js, Express, TypeScript, MongoDB y Zod. Aplica Repository, validación DTO y respuestas uniformes.

## Ejecución

Requiere Node.js 22.18+ (24 LTS recomendado), npm y MongoDB local o Atlas.

```powershell
cd backend
npm ci
npm run build
npm start
```

Para desarrollo: `npm run dev`. El servidor escucha en `http://localhost:3000` después de conectar a MongoDB.

Por defecto usa `mongodb://127.0.0.1:27017/usuarios_db`. Los scripts `start` y `dev` cargan `backend/.env` si existe. Las opciones están en `backend/.env.example`; también se pueden definir `$env:MONGO_URI` y `$env:PORT` en PowerShell.

## API

Base: `/api/v1/employees` (alias `/api/v1/empleados`). Admite GET de lista completa o paginada (`?page=1&limit=10`), GET por ID, POST, PUT, PATCH y DELETE.

Campos: `nombre`, `cargo`, `departamento` y `sueldo`. Los ejemplos están en `backend/api.rest`.

## Estructura y pruebas

`backend/src` separa dominio, repositorios, DTO, middleware, controladores y rutas. `backend/test` contiene las pruebas HTTP con repositorio en memoria.

```powershell
cd backend
npm test
npm run test:http
```

`npm test` ejecuta Jest con mocks del repositorio; `test:http` verifica el contrato HTTP con persistencia en memoria. La [práctica 05](../docs/PRACTICA_05.md) agrega la evaluación de carga contra Atlas.

## Informe

Ver [informe de la práctica y captura](../README.md).
