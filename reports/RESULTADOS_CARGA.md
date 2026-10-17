# Resultados de carga: Atlas

Resultado de los controles: **CUMPLE**. Evidencia: [JSON](stress-atlas.json).

Se ejecutó el backend real con MongoDB Atlas, base exclusiva `practica5_testing`, logging HTTP desactivado y generador local. Cada usuario crea un registro, espera un segundo, envía un payload inválido y elimina su propio registro. La eliminación añade una tercera petición al escenario de la guía.

| Métrica | Resultado |
| --- | ---: |
| Usuarios creados | 1075 |
| Usuarios completados | 1075 |
| Usuarios fallidos | 0 |
| Porcentaje de usuarios fallidos | 0.00% |
| Payloads válidos enviados / HTTP 201 | 1075 / 1075 |
| Payloads inválidos enviados / HTTP 400 | 1075 / 1075 |
| Limpiezas HTTP 200 | 1075 |
| Latencia mediana (ms) | 144 |
| Latencia p95 (ms) | 156 |
| Latencia p99 (ms), objetivo < 200 | 165.7 |
| Latencia máxima (ms) | 959 |

## Interpretación según ISO/IEC 25010

**Comportamiento temporal:** el p99 cumple el objetivo de la guía. Aproximadamente el 99% de las respuestas tarda hasta ese valor; no representa el máximo. Incluye tráfico válido, rechazo DTO y limpieza, con el costo de comunicación entre el backend y Atlas en las operaciones persistentes.

**Capacidad:** los usuarios llegan durante 20 segundos a 5/s y durante 30 segundos con rampa de 15 a 50/s en el perfil completo. Una ejecución sin fallos demuestra la capacidad observada bajo esta carga; no determina el máximo soportado por el sistema.

**Resiliencia perimetral:** 1075 rechazos frente a 1075 payloads corruptos: coinciden exactamente. Los 400 esperados no son fallos de transporte. Las pruebas HTTP con repositorio en memoria verifican además que los datos inválidos no alcanzan la persistencia.

**Errores observados:** no se registraron contadores errors.*.

## Evolución por intervalos de Artillery

| Intervalo | Usuarios nuevos | p99 (ms) | HTTP 201 | HTTP 400 |
| --- | ---: | ---: | ---: | ---: |
| 1 | 5 | 147 | 2 | 0 |
| 2 | 50 | 907 | 52 | 49 |
| 3 | 55 | 156 | 54 | 50 |
| 4 | 215 | 175.9 | 213 | 196 |
| 5 | 335 | 162.4 | 334 | 321 |
| 6 | 415 | 159.2 | 420 | 438 |
| 7 | 0 | 149.9 | 0 | 21 |

Los intervalos pueden cruzar el cambio de fase; el último incluye solicitudes pendientes. La serie permite observar fluctuaciones, pero una sola ejecución no demuestra crecimiento lineal o exponencial. Para atribuir degradación al Event Loop se necesita perfilar CPU, retraso del bucle y pausas de GC, además de medir la latencia y los límites de Atlas. Posibles causas incluyen serialización, validación costosa, logging síncrono, bloqueo de CPU, red o saturación del pool; estas causas no se dan por comprobadas aquí.
