# Explicación de la prueba de estrés

## ¿Qué se busca comprobar?

La prueba usa **Artillery** para simular usuarios que envían solicitudes concurrentes a la API de empleados. Evalúa si el sistema mantiene tiempos de respuesta aceptables y rechaza datos inválidos cuando aumenta el tráfico. En la práctica, esto permite observar el comportamiento temporal y la capacidad, atributos de calidad contemplados en la guía basada en ISO/IEC 25010.

## ¿Cómo se ejecuta?

Desde la raíz del repositorio, con las dependencias instaladas y `MONGO_TEST_URI` configurada en `code/backend/.env`:

```powershell
npm run test:stress:atlas
```

El comando conecta con la base `practica5_testing` de MongoDB Atlas, levanta un backend de prueba en el puerto 3001 y ejecuta el escenario de [stress-test.yml](../stress-test.yml). No requiere abrir Angular. Al terminar, limpia los registros de esta ejecución y cierra el servidor de prueba.

## ¿Qué tráfico genera?

| Fase | Duración | Llegada de usuarios nuevos |
| --- | --- | --- |
| Calentamiento | 20 segundos | 5 por segundo |
| Saturación incremental | 30 segundos | Aumenta de 15 a 50 por segundo |

Estas tasas indican cuántos usuarios comienzan por segundo; la cantidad de usuarios simultáneos depende de cuánto tarda cada escenario. La generación dura 50 segundos y después se espera a que terminen las solicitudes pendientes.

Cada usuario virtual realiza este recorrido:

1. Envía un **POST válido** para crear un empleado; espera una respuesta **201** y guarda el ID recibido.
2. Espera un segundo para simular una pausa entre acciones.
3. Envía un **POST inválido**, con nombre demasiado corto y sueldo negativo; espera una respuesta **400** del validador Zod.
4. Elimina el empleado que creó mediante **DELETE**; espera una respuesta **200**.

El rechazo 400 es un resultado esperado: confirma que la API está validando los datos. Las pruebas HTTP complementarias verifican que las entradas inválidas no llegan al repositorio.

## ¿Qué significan los resultados?

La ejecución registrada produjo estos valores:

| Indicador | Resultado | Interpretación |
| --- | --- | --- |
| Usuarios completados | 1075 de 1075 | Todos terminaron el recorrido |
| Respuestas 201 | 1075 | Los registros válidos fueron creados |
| Respuestas 400 | 1075 | Cada payload inválido fue rechazado |
| Respuestas 200 de eliminación | 1075 | Los registros creados fueron eliminados |
| Usuarios fallidos | 0 | No hubo escenarios fallidos |
| p99 agregado | 165.7 ms | Aproximadamente el 99% de las respuestas quedó dentro de ese tiempo |

El criterio de aceptación exige **p99 menor de 200 ms**, **usuarios fallidos como máximo del 1%** y coincidencia de los contadores de envíos con las respuestas esperadas. La ejecución cumplió todos esos controles.

El p99 no es el máximo: hubo una respuesta de hasta **959 ms**. Además, el control de p99 se aplica al conjunto de la ejecución; algunos intervalos pueden tener valores superiores. Los resultados completos están en el [reporte de carga](../reports/RESULTADOS_CARGA.md).

## Conclusión para la exposición

La API soportó la carga ensayada, procesó los registros válidos y rechazó todos los datos corruptos enviados. El p99 agregado quedó por debajo del límite establecido y no hubo usuarios fallidos. Esto aporta evidencia de rendimiento y validación bajo este escenario; no determina la capacidad máxima del sistema ni garantiza el mismo resultado con otra red, infraestructura o volumen de tráfico.
