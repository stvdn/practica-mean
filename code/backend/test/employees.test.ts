import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/app.js';
import type { IEmployeeRepository } from '../src/repositories/employee.repository.js';
import type { Employee, EmployeeData, EmployeeQuery } from '../src/domain/employee.js';

const valid = { nombre: 'Andrés Mendoza', cargo: 'Arquitecto', departamento: 'Innovación', sueldo: 4500 };
class MemoryRepository implements IEmployeeRepository {
  employees: Employee[] = [];
  calls = 0;
  fail = false;
  async findAll(query: EmployeeQuery) {
    this.calls++;
    if (this.fail) throw new Error('mongodb://secret:password@internal');
    const start = ((query.page ?? 1) - 1) * (query.limit ?? 0);
    return { employees: query.limit ? this.employees.slice(start, start + query.limit) : [...this.employees], total: this.employees.length };
  }
  async findById(id: string) { this.calls++; return this.employees.find(e => e._id === id) ?? null; }
  async create(data: EmployeeData) {
    this.calls++;
    const employee = { ...data, _id: (this.employees.length + 1).toString(16).padStart(24, '0'),
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.employees = [...this.employees, employee];
    return employee;
  }
  async update(id: string, data: Partial<EmployeeData>) {
    this.calls++;
    const old = this.employees.find(e => e._id === id);
    if (!old) return null;
    const updated = { ...old, ...data };
    this.employees = this.employees.map(e => e._id === id ? updated : e);
    return updated;
  }
  async delete(id: string) {
    this.calls++;
    const old = this.employees.find(e => e._id === id) ?? null;
    this.employees = this.employees.filter(e => e._id !== id);
    return old;
  }
}
async function setup(t: import('node:test').TestContext) {
  const repository = new MemoryRepository();
  const server = createApp(repository).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  const request = async (path = '', method = 'GET', body?: unknown) => {
    const response = await fetch(`${base}/api/v1/employees${path}`, {
      method, headers: { 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json() };
  };
  return { repository, request, base };
}

test('CRUD completo, consulta individual, PUT, PATCH y eliminación', async t => {
  const { request } = await setup(t);
  const created = await request('', 'POST', valid);
  assert.equal(created.status, 201);
  assert.equal(created.body.success, true);
  assert.deepEqual(created.body.errors, []);
  const id = created.body.data._id;
  assert.equal((await request()).body.data.length, 1);
  assert.equal((await request(`/${id}`)).body.data.nombre, valid.nombre);
  assert.equal((await request(`/${id}`, 'PATCH', { sueldo: 5000 })).body.data.sueldo, 5000);
  const replaced = await request(`/${id}`, 'PUT', { ...valid, cargo: 'Director' });
  assert.equal(replaced.body.data.cargo, 'Director');
  assert.equal((await request(`/${id}`, 'DELETE')).body.data._id, id);
  assert.equal((await request(`/${id}`)).status, 404);
  assert.deepEqual((await request()).body.data, []);
});

test('paginación y alias español conservan el contrato', async t => {
  const { request, base } = await setup(t);
  await request('', 'POST', valid);
  await request('', 'POST', { ...valid, nombre: 'Otra Persona' });
  const page = await request('?page=2&limit=1');
  assert.equal(page.body.data.length, 1);
  assert.equal(page.body.data[0].nombre, 'Otra Persona');
  assert.deepEqual(page.body.meta, { total: 2, page: 2, limit: 1, pages: 2 });
  const response = await fetch(`${base}/api/v1/empleados`);
  assert.equal((await response.json()).data.length, 2);
});

test('DTO rechaza tipos, campos desconocidos e inyecciones antes del repositorio', async t => {
  const { repository, request } = await setup(t);
  for (const body of [undefined, null, [], {}, { ...valid, nombre: 'An' },
    { ...valid, nombre: '   ' }, { ...valid, sueldo: -1 }, { ...valid, sueldo: '100' },
    { ...valid, _id: 'injected' }, { $set: valid }]) {
    const result = await request('', 'POST', body);
    assert.equal(result.status, 400);
    assert.equal(result.body.success, false);
    assert.equal(result.body.data, null);
    assert.ok(result.body.errors.length > 0);
  }
  assert.equal(repository.calls, 0);
});

test('params, query, PUT y PATCH se validan antes de acceder a datos', async t => {
  const { repository, request } = await setup(t);
  const id = '000000000000000000000001';
  for (const method of ['GET', 'PUT', 'PATCH', 'DELETE']) {
    assert.equal((await request('/invalid', method, method === 'PUT' ? valid : undefined)).status, 400);
  }
  for (const query of ['?page=0', '?limit=101', '?page=abc', '?page=1.5', '?unknown=x']) {
    assert.equal((await request(query)).status, 400);
  }
  assert.equal((await request(`/${id}`, 'PATCH', {})).status, 400);
  assert.equal((await request(`/${id}`, 'PATCH', { $set: valid })).status, 400);
  assert.equal((await request(`/${id}`, 'PUT', { sueldo: 100 })).status, 400);
  assert.equal(repository.calls, 0);
});

test('IDs inexistentes producen 404 uniforme', async t => {
  const { request } = await setup(t);
  for (const method of ['GET', 'PUT', 'PATCH', 'DELETE']) {
    const result = await request('/ffffffffffffffffffffffff', method,
      method === 'PUT' ? valid : method === 'PATCH' ? { sueldo: 1 } : undefined);
    assert.equal(result.status, 404);
    assert.deepEqual(result.body, { success: false, message: 'Empleado no encontrado', data: null, errors: [] });
  }
});

test('errores internos, JSON inválido, tamaño y rutas desconocidas usan wrapper sin filtrar excepciones', async t => {
  const { repository, request, base } = await setup(t);
  repository.fail = true;
  const result = await request();
  assert.equal(result.status, 500);
  assert.equal(JSON.stringify(result.body).includes('password'), false);
  assert.deepEqual(result.body, { success: false, message: 'Error interno del servidor', data: null, errors: [] });
  for (const [body, status] of [['{bad', 400], [JSON.stringify({ text: 'x'.repeat(110000) }), 413]] as const) {
    const response = await fetch(`${base}/api/v1/employees`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    assert.equal(response.status, status);
    assert.equal((await response.json()).success, false);
  }
  const missing = await fetch(`${base}/missing`);
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).success, false);
});
