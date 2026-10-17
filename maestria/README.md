# Práctica 03: Frontend MEAN

Cliente Angular para registrar, listar, editar y eliminar empleados. Utiliza formularios reactivos, un servicio RxJS con estado inmutable y componentes Smart y Dumb.

## Ejecución

Requiere Node.js 20+, npm y el backend activo en `http://localhost:3000`.

```powershell
npm ci
npm start
```

Abrir `http://localhost:4200`. La dirección de la API se configura en `src/environments/environment.ts` y `environment.prod.ts`.

## Estructura

- `src/app/services`: acceso HTTP y estado reactivo.
- `src/app/components/empleado`: componente orquestador con `async`.
- `src/app/components/empleado-form`: formulario presentacional.
- `src/app/components/empleado-table`: tabla y confirmación de eliminación.

## Verificación

```powershell
npm run build
$env:CHROME_BIN = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
npm test -- --watch=false --browsers=ChromeHeadless
```

La compilación se genera en `dist/`, excluido de Git junto con las dependencias y la caché de Angular.

## Informe

Ver [informe de la práctica y captura](../README.md).
