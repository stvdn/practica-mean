# Práctica 3: Stack MEAN

CRUD de empleados: backend TypeScript en `code/backend` y cliente Angular en `maestria`.

## Ejecución

Requiere Node.js 20+ (verificado con Node 22), npm y MongoDB local o Atlas.

Backend, desde PowerShell:

```powershell
cd code/backend
npm install
$env:MONGO_URI = 'mongodb://127.0.0.1:27017/usuarios_db'
$env:PORT = '3000'
npm run dev
```

Las variables son opcionales con esos valores predeterminados. `.env.example` documenta las opciones; el servidor lee variables del entorno y no carga archivos `.env` automáticamente. Espera la conexión a MongoDB antes de escuchar peticiones.

En otra terminal:

```powershell
cd maestria
npm install
npm start
```

Abrir http://localhost:4200. La URL del backend se configura en `maestria/src/environments/environment.ts` y `environment.prod.ts`. Antes de desplegar, establecer allí la dirección del servidor publicado.

## Los cuatro retos

1. **Repository.** `domain/employee.ts` define el dominio; `repositories/employee.repository.ts` contiene `IEmployeeRepository`. `MongoEmployeeRepository` adapta MongoDB al contrato. `index.ts` conecta la base e inyecta el repositorio en `createApp`. Los controladores, las rutas y la aplicación no importan Mongoose. Se conserva la colección `empleados`.
2. **DTO y respuesta universal.** `dto/employee.dto.ts` contiene esquemas Zod estrictos para cuerpos, IDs y paginación. El middleware `validate` rechaza entradas antes del controlador. `errorHandler` unifica validaciones, JSON inválido, tamaño excesivo, recursos inexistentes y excepciones sin exponer errores internos al cliente.
3. **Servicio reactivo e inmutable.** `EmployeeService` encapsula HTTP y un `BehaviorSubject` privado. Expone observables de solo lectura y `vm$`. Las mutaciones crean referencias nuevas mediante spread, map y filter. Los comandos se procesan secuencialmente y los errores permiten reintentar. El alias `EmpleadoService` conserva compatibilidad con los imports existentes.
4. **Smart y Dumb Components.** `EmpleadoComponent` consume `vm$` con `async` y orquesta eventos. `EmpleadoFormComponent` y `EmpleadoTableComponent` se comunican mediante `@Input` y `@Output`; no conocen servicios ni HTTP. El formulario copia las entradas en un formulario reactivo local y se reinicia después de guardar correctamente. La tabla solicita confirmación para eliminar.

Los componentes no tienen suscripciones manuales. La vista informa carga, errores y éxito, permite reintentar y bloquea controles durante solicitudes. En SSR, la carga HTTP se inicia en el navegador para evitar depender del backend durante el prerenderizado.

## Contrato HTTP

Base: `http://localhost:3000/api/v1/employees`. Alias: `/api/v1/empleados`.

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/` | Lista completa, 200 |
| GET | `/?page=1&limit=10` | Lista paginada y `meta`, 200 |
| GET | `/:id` | Empleado individual, 200 |
| POST | `/` | Empleado creado, 201 |
| PUT | `/:id` | Sustitución de los cuatro campos de negocio, 200 |
| PATCH | `/:id` | Actualización parcial, al menos un campo, 200 |
| DELETE | `/:id` | Empleado eliminado físicamente, 200 |

Cuerpo de creación y PUT:

```json
{"nombre":"Andrés Mendoza","cargo":"Arquitecto","departamento":"Innovación","sueldo":4500}
```

`nombre`: 3–100 caracteres; `cargo` y `departamento`: 2–100; se recortan espacios. `sueldo`: número finito mayor o igual a cero, sin conversión desde cadenas. Se rechazan campos adicionales, operadores MongoDB e identificadores en el cuerpo. `id`: 24 caracteres hexadecimales. `page`: entero entre 1 y 1000000; `limit`: entero entre 1 y 100. Si se especifica uno, el otro toma 1 o 10 respectivamente. Sin ambos se devuelve la lista completa. El ID se expone como `_id` de tipo string y los timestamps como ISO 8601.

Éxito:

```json
{"success":true,"message":"Empleado creado","data":{"_id":"000000000000000000000001","nombre":"Andrés Mendoza","cargo":"Arquitecto","departamento":"Innovación","sueldo":4500,"createdAt":"2026-10-16T00:00:00.000Z","updatedAt":"2026-10-16T00:00:00.000Z"},"errors":[]}
```

Error:

```json
{"success":false,"message":"Datos de entrada inválidos","data":null,"errors":[{"field":"sueldo","message":"..."}]}
```

La lista paginada agrega `meta: { total, page, limit, pages }`. Errores: 400 validación/JSON, 404 recurso o ruta inexistente, 413 cuerpo superior a 100 KB y 500 fallo interno.

`code/backend/api.rest` contiene ejemplos para REST Client. Sustituir `employeeId` por el ID recibido al crear.

## Verificación

```powershell
cd code/backend
npm run build
npm test
cd maestria
npm run build
$env:CHROME_BIN = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
npm test -- --watch=false --browsers=ChromeHeadless
```

Las pruebas HTTP inyectan un repositorio en memoria para verificar CRUD, paginación, validación previa a persistencia y errores uniformes sin MongoDB. Las pruebas Angular verifican referencias inmutables, recuperación tras errores, peticiones compartidas, aislamiento del formulario y composición con async. No sustituyen una integración contra una instancia real de MongoDB.

## Informe de la práctica

Ver [informe breve y evidencia visual](PRACTICA.md).
