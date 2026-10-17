import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { MongoEmployeeRepository } from '../src/repositories/mongo-employee.repository.js';
import { EmployeeModel } from '../src/models/empleado.js';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const uri = process.env.MONGO_TEST_URI;
if (!uri || new URL(uri).pathname !== '/practica5_testing') {
  throw new Error('Configure MONGO_TEST_URI con una base exclusiva llamada practica5_testing.');
}
const profile = process.argv.includes('--smoke') ? 'smoke' : 'full';
const runId = randomUUID();
await mkdir(path.join(root, 'reports'), { recursive: true });

// La carga usa el repositorio Mongo real; solo se desactiva el log por petición.
try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
} catch {
  console.error('No se pudo conectar a Atlas. Revise credenciales y lista de acceso IP.');
  process.exit(1);
}
const port = Number(process.env.STRESS_PORT || 3001);
if (!Number.isInteger(port) || port < 1024 || port > 49151) {
  await mongoose.disconnect();
  throw new Error('STRESS_PORT debe estar entre 1024 y 49151 para evitar puertos efímeros.');
}
const server = createApp(new MongoEmployeeRepository(), { logging: false }).listen(port, '127.0.0.1');
try {
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Servidor de prueba no disponible');
  const args = [path.join(root, 'node_modules/artillery/bin/run'), 'run',
    '--target', `http://127.0.0.1:${address.port}`,
    '--output', `reports/stress-${profile}-raw.json`,
    ...(profile === 'smoke' ? ['--overrides', JSON.stringify({ config: {
      phases: [{ duration: 1, arrivalCount: 1, name: 'Verificacion del escenario' }],
    } })] : []), 'stress-test.yml'];
  console.log(`Carga ${profile}: Atlas, base practica5_testing; ID ${runId}`);
  const child = spawn(process.execPath, args, {
    cwd: root, stdio: 'inherit', env: { ...process.env, STRESS_RUN_ID: runId },
  });
  const [code] = await once(child, 'exit');
  process.exitCode = typeof code === 'number' ? code : 1;
} finally {
  // También limpia los registros de ESTA ejecución si falla un escenario.
  const result = await EmployeeModel.deleteMany({ nombre: `Prueba ${runId}` });
  console.log(`Limpieza final: ${result.deletedCount} registros residuales de esta ejecución.`);
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  await mongoose.disconnect();
}
const summary = spawn(process.execPath, [path.join(root, 'scripts/stress-report.mjs'),
  `reports/stress-${profile}-raw.json`, `reports/stress-${profile === 'full' ? 'atlas' : 'smoke'}.json`,
  `reports/${profile === 'full' ? 'RESULTADOS_CARGA' : 'RESULTADOS_SMOKE'}.md`],
{ cwd: root, stdio: 'inherit' });
const [summaryCode] = await once(summary, 'exit');
if (summaryCode !== 0) process.exitCode = 1;
