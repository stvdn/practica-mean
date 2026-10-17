import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const input = process.argv[2] || 'reports/stress-full-raw.json';
const output = process.argv[3] || 'reports/stress-atlas.json';
const markdown = process.argv[4] || 'reports/RESULTADOS_CARGA.md';
const report = JSON.parse(await readFile(input, 'utf8'));
const aggregate = report.aggregate;
if (!aggregate?.counters || !aggregate?.summaries) throw new Error('Reporte Artillery inválido');
const counters = aggregate.counters;
const count = key => counters[key] ?? 0;
const latency = aggregate.summaries['http.response_time'];
const created = count('vusers.created');
const failed = count('vusers.failed');
const errorRate = created ? failed / created * 100 : null;
const valid = count('payload.valid.sent');
const invalid = count('payload.invalid.sent');
const checks = {
  p99Below200ms: typeof latency?.p99 === 'number' && latency.p99 < 200,
  failedUsersAtMostOnePercent: errorRate !== null && errorRate <= 1,
  validCreatesMatch: valid > 0 && count('http.codes.201') === valid,
  invalidRejectionsMatch: invalid > 0 && count('http.codes.400') === invalid,
  cleanupMatches: valid > 0 && count('http.codes.200') === count('http.codes.201'),
};
const intervals = (report.intermediate || []).map((item, index) => ({
  interval: index + 1,
  createdUsers: item.counters?.['vusers.created'] ?? 0,
  p99ms: item.summaries?.['http.response_time']?.p99 ?? null,
  created: item.counters?.['http.codes.201'] ?? 0,
  rejected: item.counters?.['http.codes.400'] ?? 0,
}));
// Solo evidencia de métricas: excluye configuración de entorno y credenciales.
const evidence = { source: path.basename(input), generatedAt: new Date().toISOString(),
  runtime: process.version, database: 'practica5_testing', logging: false,
  checks, aggregate, intervals };
await writeFile(output, JSON.stringify(evidence, null, 2) + '\n');
const result = Object.values(checks).every(Boolean) ? 'CUMPLE' : 'NO CUMPLE';
const errors = Object.entries(counters).filter(([key]) => key.startsWith('errors.'));
const rows = intervals.map(i => `| ${i.interval} | ${i.createdUsers} | ${i.p99ms ?? 'Sin datos'} | ${i.created} | ${i.rejected} |`).join('\n');
await writeFile(markdown, `# Resultados de carga: Atlas

Resultado de los controles: **${result}**. Evidencia: [JSON](${path.basename(output)}).

Se ejecutó el backend real con MongoDB Atlas, base exclusiva \`practica5_testing\`, logging HTTP desactivado y generador local. Cada usuario crea un registro, espera un segundo, envía un payload inválido y elimina su propio registro. La eliminación añade una tercera petición al escenario de la guía.

| Métrica | Resultado |
| --- | ---: |
| Usuarios creados | ${created} |
| Usuarios completados | ${count('vusers.completed')} |
| Usuarios fallidos | ${failed} |
| Porcentaje de usuarios fallidos | ${errorRate === null ? 'Sin datos' : errorRate.toFixed(2) + '%'} |
| Payloads válidos enviados / HTTP 201 | ${valid} / ${count('http.codes.201')} |
| Payloads inválidos enviados / HTTP 400 | ${invalid} / ${count('http.codes.400')} |
| Limpiezas HTTP 200 | ${count('http.codes.200')} |
| Latencia mediana (ms) | ${latency?.median ?? 'Sin datos'} |
| Latencia p95 (ms) | ${latency?.p95 ?? 'Sin datos'} |
| Latencia p99 (ms), objetivo < 200 | ${latency?.p99 ?? 'Sin datos'} |
| Latencia máxima (ms) | ${latency?.max ?? 'Sin datos'} |

## Interpretación según ISO/IEC 25010

**Comportamiento temporal:** el p99 ${checks.p99Below200ms ? 'cumple' : 'no cumple'} el objetivo de la guía. Aproximadamente el 99% de las respuestas tarda hasta ese valor; no representa el máximo. Incluye tráfico válido, rechazo DTO y limpieza, con el costo de comunicación entre el backend y Atlas en las operaciones persistentes.

**Capacidad:** los usuarios llegan durante 20 segundos a 5/s y durante 30 segundos con rampa de 15 a 50/s en el perfil completo. Una ejecución sin fallos demuestra la capacidad observada bajo esta carga; no determina el máximo soportado por el sistema.

**Resiliencia perimetral:** ${count('http.codes.400')} rechazos frente a ${invalid} payloads corruptos: ${checks.invalidRejectionsMatch ? 'coinciden exactamente' : 'no coinciden'}. Los 400 esperados no son fallos de transporte. Las pruebas HTTP con repositorio en memoria verifican además que los datos inválidos no alcanzan la persistencia.

**Errores observados:** ${errors.length ? errors.map(([name, value]) => name + ': ' + value).join('; ') : 'no se registraron contadores errors.*'}.

## Evolución por intervalos de Artillery

| Intervalo | Usuarios nuevos | p99 (ms) | HTTP 201 | HTTP 400 |
| --- | ---: | ---: | ---: | ---: |
${rows}

Los intervalos pueden cruzar el cambio de fase; el último incluye solicitudes pendientes. La serie permite observar fluctuaciones, pero una sola ejecución no demuestra crecimiento lineal o exponencial. Para atribuir degradación al Event Loop se necesita perfilar CPU, retraso del bucle y pausas de GC, además de medir la latencia y los límites de Atlas. Posibles causas incluyen serialización, validación costosa, logging síncrono, bloqueo de CPU, red o saturación del pool; estas causas no se dan por comprobadas aquí.
`);
console.log(`Reporte: ${markdown}; SLA ${result}; p99 ${latency?.p99 ?? 'N/D'} ms.`);
