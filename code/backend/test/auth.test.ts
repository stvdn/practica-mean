import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { createApp } from '../src/app.js';
import type { IEmployeeRepository } from '../src/repositories/employee.repository.js';
import { MemoryAuthRepository, testSecret, testToken } from './helpers/auth.js';

async function setup(t: import('node:test').TestContext) {
  let employeeCalls = 0;
  const repository: IEmployeeRepository = {
    async findAll() { employeeCalls++; return { employees: [], total: 0 }; },
    async findById() { employeeCalls++; return null; },
    async create() { employeeCalls++; throw new Error('Unused'); },
    async update() { employeeCalls++; return null; },
    async delete() { employeeCalls++; return null; },
  };
  const auth = new MemoryAuthRepository();
  const server = createApp(repository, { authRepository: auth, jwtSecret: testSecret, logging: false }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  async function post(path: string, body: unknown) {
    const response = await fetch(`${base}/api/v1/auth/${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  }
  return { base, auth, post, employeeCalls: () => employeeCalls };
}

test('registro normaliza correo, persiste hash y login emite JWT de dos horas', async t => {
  const { post, auth } = await setup(t);
  const created = await post('register', { email: ' Ana@Example.com ', password: 'secreto123' });
  assert.equal(created.status, 201);
  assert.deepEqual(created.body.data, { email: 'ana@example.com', rol: 'alumno' });
  assert.equal(JSON.stringify(created.body).includes('password'), false);
  assert.ok(await bcrypt.compare('secreto123', auth.users[0]!.passwordHash));
  const logged = await post('login', { email: 'ANA@example.com', password: 'secreto123' });
  assert.equal(logged.status, 200);
  const claims = jwt.verify(logged.body.data.token, testSecret, { algorithms: ['HS256'] }) as jwt.JwtPayload;
  assert.equal(claims.id, auth.users[0]!.id);
  assert.equal(claims.rol, 'alumno');
  assert.equal(claims.exp! - claims.iat!, 7200);
  assert.equal((await post('register', { email: 'ana@example.com', password: 'otra123' })).status, 409);
  const wrong = await post('login', { email: 'ana@example.com', password: 'incorrecta' });
  const missing = await post('login', { email: 'missing@example.com', password: 'incorrecta' });
  assert.equal(wrong.status, 401);
  assert.deepEqual(wrong, missing);
});

test('DTO rechaza campos extra, roles y contraseñas fuera del límite antes del repositorio', async t => {
  const { post, auth } = await setup(t);
  for (const path of ['login', 'register']) {
    for (const body of [{}, { email: 'bad', password: '123456' },
      { email: 'a@example.com', password: '123' }, { email: 'a@example.com', password: '😀'.repeat(19) },
      { email: 'a@example.com', password: 'secreto123', rol: 'admin' }]) {
      assert.equal((await post(path, body)).status, 400);
    }
  }
  assert.equal(auth.calls, 0);
});

test('un registro concurrente duplicado devuelve 409 y no expone el error de persistencia', async t => {
  const { post, auth } = await setup(t);
  const credentials = { email: 'same@example.com', password: 'secreto123' };
  const results = await Promise.all([post('register', credentials), post('register', credentials)]);
  assert.deepEqual(results.map(result => result.status).sort(), [201, 409]);
  assert.equal(auth.users.length, 1);
  assert.equal(JSON.stringify(results).includes('11000'), false);
});

test('ambos alias y todos los métodos rechazan tokens ausentes o inválidos sin acceder al repositorio', async t => {
  const { base, employeeCalls } = await setup(t);
  const badTokens = ['Bearer broken', 'Basic abc',
    `Bearer ${jwt.sign({ id: 'u', rol: 'alumno' }, testSecret, { expiresIn: -1 })}`,
    `Bearer ${jwt.sign({ id: 'u', rol: 'alumno' }, 'another-key', { expiresIn: '2h' })}`,
    `Bearer ${jwt.sign({ rol: 'alumno' }, testSecret, { expiresIn: '2h' })}`];
  for (const alias of ['employees', 'empleados']) {
    for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
      const url = `${base}/api/v1/${alias}${['PUT', 'PATCH', 'DELETE'].includes(method) ? '/000000000000000000000001' : ''}`;
      assert.equal((await fetch(url, { method })).status, 401);
      for (const Authorization of badTokens) {
        const result = await fetch(url, { method, headers: { Authorization } });
        assert.equal(result.status, 403);
        assert.equal((await result.json()).success, false);
      }
    }
  }
  assert.equal(employeeCalls(), 0);
  const allowed = await fetch(`${base}/api/v1/employees`, { headers: { Authorization: `Bearer ${testToken()}` } });
  assert.equal(allowed.status, 200);
  assert.equal(employeeCalls(), 1);
});
