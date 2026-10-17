# Práctica 05: evaluación de atributos de calidad mediante testing

**Asignatura:** Patrones de Diseño de APIs. **Marco de evaluación:** ISO/IEC 25010, según la guía entregada.

## Objetivo e implementación

Evaluar la modularidad, capacidad de prueba, comportamiento temporal y capacidad del CRUD de empleados. La implementación adapta los ejemplos del PDF al contrato existente: el método es `list`, recibe los DTO validados en `res.locals` y responde con `success`, `message`, `data` y `errors`.

- **Fase A, Jest:** pruebas de caja blanca del controlador con `jest.Mocked<IEmployeeRepository>`. Cubren consulta, paginación, creación, actualización, eliminación, recursos inexistentes y propagación de fallos. El archivo unitario no importa Mongoose ni inicia una base de datos.
- **Verificación perimetral:** se conservan las pruebas HTTP con repositorio en memoria; comprueban que Zod rechaza entradas inválidas antes de acceder al repositorio.
- **Fase B, Artillery:** 20 segundos a 5 usuarios/s, seguidos de 30 segundos con rampa de 15 a 50 usuarios/s. Cada usuario envía un POST válido, espera un segundo, envía un POST inválido y elimina su registro. Se exige p99 < 200 ms, usuarios fallidos <= 1% y coincidencia exacta de los contadores de envíos y respuestas esperadas. El DELETE adicional evita acumular datos.

## Ejecución reproducible

Desde la raíz del repositorio, con Node.js 24 LTS recomendado (también compatible con 22.18+):

```powershell
npm ci
npm ci --prefix code/backend
npm run build --prefix code/backend
npm run test:types --prefix code/backend
npm test
npm run test:http
```

Copiar `code/backend/.env.example` a `code/backend/.env` y configurar `MONGO_TEST_URI` con una URI real de Atlas cuyo nombre de base sea **`practica5_testing`**. El archivo `.env` está excluido de Git. En Atlas deben existir el usuario de base de datos y el permiso de acceso desde la IP del equipo.

```powershell
# Una transacción para verificar conexión, validación y limpieza.
npm run test:stress:smoke

# Perfil completo; levanta un backend propio en el puerto 3001.
npm run test:stress:atlas
```

El ejecutor usa el repositorio Mongo real, desactiva únicamente el logging HTTP por petición y genera evidencia en `reports/`. Elimina exclusivamente registros identificados por el UUID de esta ejecución dentro de la base de pruebas. No requiere detener el backend habitual del puerto 3000. Si 3001 está ocupado, definir `$env:STRESS_PORT` con otro puerto entre 1024 y 49151.

Para ejecutar Artillery manualmente contra un backend ya configurado con una base de pruebas: `npm run test:stress`. El destino predeterminado es `http://127.0.0.1:3000`; admite `-- --target URL`. Este comando no cambia la conexión Mongo del servidor de destino ni ejecuta la limpieza final del orquestador.

## Evidencia y análisis

Para presentar el procedimiento y sus métricas, consultar la [explicación de la prueba de estrés](EXPLICACION_ESTRES.md).

Resultados de la ejecución del 17 de octubre de 2026 con Node.js 22.19 y Artillery 2.0.34:

| Evaluación | Resultado |
| --- | --- |
| Compilación y tipos de pruebas | Correctos |
| Jest aislado | 11 pruebas aprobadas; cobertura del controlador: 100% de líneas y ramas |
| Contrato HTTP con repositorio en memoria | 6 pruebas aprobadas |
| Usuarios de carga creados/completados | 1075 / 1075 |
| HTTP 201 / payloads válidos | 1075 / 1075 |
| HTTP 400 / payloads inválidos | 1075 / 1075 |
| Registros eliminados mediante HTTP 200 | 1075 |
| Usuarios fallidos | 0 |
| p99 agregado / límite | 165.7 ms / < 200 ms: cumple |

Evidencia: [Jest](../reports/jest.json), [métricas Artillery](../reports/stress-atlas.json), [análisis de carga](../reports/RESULTADOS_CARGA.md) y [verificación breve](../reports/RESULTADOS_SMOKE.md). Los resultados son una medición de este entorno y pueden cambiar al repetir la ejecución.

El informe de carga generado detalla respuestas 201/400, usuarios fallidos, percentiles, evolución por intervalos y cumplimiento del SLA. Una respuesta 400 esperada es un rechazo de validación, no un fallo de socket.

**¿Por qué no hace falta MongoDB para probar el controlador?** Porque el controlador depende de la interfaz `IEmployeeRepository`, no de su implementación Mongo. La inyección permite sustituir la persistencia por funciones `jest.fn()` con resultados y fallos controlados. Así se prueba la responsabilidad HTTP sin infraestructura externa; las pruebas con Atlas cubren otra frontera de integración.

**¿Cómo interpretar p99 y la saturación?** El p99 aproxima el tiempo dentro del cual termina el 99% de las respuestas. El límite de 200 ms se mantiene aunque Atlas o la red hagan fallar el SLA. Los intervalos de Artillery permiten observar la evolución, pero una ejecución no prueba por sí sola crecimiento lineal/exponencial ni que el Event Loop sea la causa. Para atribuir cuellos de botella se necesitan perfiles de CPU, retraso del bucle, GC, red y pool de conexiones.

Los logs JSON originales de carga quedan locales; los reportes de métricas y el análisis se pueden compartir sin credenciales. La versión de la guía adjunta muestra número 04 en su encabezado; aquí se conserva el nombre práctica 05 solicitado.

## Referencias de implementación

- [Soporte ESM de ts-jest](https://kulshekhar.github.io/ts-jest/docs/guides/esm-support).
- [Controles de métricas de Artillery](https://www.artillery.io/docs/reference/extensions/ensure).
- [Aserciones HTTP de Artillery](https://www.artillery.io/docs/reference/extensions/expect).
