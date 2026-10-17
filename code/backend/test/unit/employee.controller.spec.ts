import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';
import { EmployeeController } from '../../src/controllers/empleados.controllers.js';
import type { IEmployeeRepository } from '../../src/repositories/employee.repository.js';
import type { Employee } from '../../src/domain/employee.js';
import { AppError } from '../../src/middleware/error-handler.js';

const employee: Employee = {
  _id: '000000000000000000000001', nombre: 'Andrés Mendoza',
  cargo: 'Arquitecto', departamento: 'TI', sueldo: 4000,
  createdAt: '2026-10-17T00:00:00.000Z', updatedAt: '2026-10-17T00:00:00.000Z',
};
const data = { nombre: employee.nombre, cargo: employee.cargo,
  departamento: employee.departamento, sueldo: employee.sueldo };

describe('EmployeeController: modularidad y capacidad de prueba', () => {
  let repository: jest.Mocked<IEmployeeRepository>;
  let controller: EmployeeController;
  let response: Response;
  let json: jest.Mock;
  let status: jest.Mock;
  const request = {} as Request;
  const next: NextFunction = () => {};

  beforeEach(() => {
    // El doble implementa solo el contrato: no abre conexiones ni importa un ODM.
    repository = {
      findAll: jest.fn<IEmployeeRepository['findAll']>(),
      findById: jest.fn<IEmployeeRepository['findById']>(),
      create: jest.fn<IEmployeeRepository['create']>(),
      update: jest.fn<IEmployeeRepository['update']>(),
      delete: jest.fn<IEmployeeRepository['delete']>(),
    };
    controller = new EmployeeController(repository);
    json = jest.fn();
    status = jest.fn();
    response = { locals: { query: {}, params: { id: employee._id }, body: data },
      json, status } as unknown as Response;
    status.mockReturnValue(response);
  });

  it('consulta la abstracción una vez y devuelve una respuesta uniforme', async () => {
    repository.findAll.mockResolvedValue({ employees: [employee], total: 1 });
    await controller.list(request, response, next);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith({});
    expect(json).toHaveBeenCalledWith({ success: true, message: 'Empleados consultados',
      data: [employee], errors: [] });
  });

  it('conserva la paginación y calcula el total de páginas', async () => {
    response.locals.query = { page: 2, limit: 2 };
    repository.findAll.mockResolvedValue({ employees: [employee], total: 5 });
    await controller.list(request, response, next);
    expect(repository.findAll).toHaveBeenCalledWith({ page: 2, limit: 2 });
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      meta: { total: 5, page: 2, limit: 2, pages: 3 },
    }));
  });

  it('consulta un empleado por su identificador', async () => {
    repository.findById.mockResolvedValue(employee);
    await controller.get(request, response, next);
    expect(repository.findById).toHaveBeenCalledWith(employee._id);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ data: employee, success: true }));
  });

  it('usa la página inicial y devuelve cero páginas cuando la colección está vacía', async () => {
    response.locals.query = { limit: 10 };
    repository.findAll.mockResolvedValue({ employees: [], total: 0 });
    await controller.list(request, response, next);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      data: [], meta: { total: 0, page: 1, limit: 10, pages: 0 },
    }));
  });

  it('registra con estado 201 usando únicamente el repositorio inyectado', async () => {
    repository.create.mockResolvedValue(employee);
    await controller.create(request, response, next);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(data);
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({ success: true, message: 'Empleado creado',
      data: employee, errors: [] });
  });

  it('delega la actualización sin mutar la entrada', async () => {
    response.locals.body = Object.freeze({ sueldo: 4500 });
    repository.update.mockResolvedValue({ ...employee, sueldo: 4500 });
    await controller.update(request, response, next);
    expect(repository.update).toHaveBeenCalledWith(employee._id, { sueldo: 4500 });
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      data: { ...employee, sueldo: 4500 },
    }));
  });

  it('delega la eliminación y devuelve el registro eliminado', async () => {
    repository.delete.mockResolvedValue(employee);
    await controller.delete(request, response, next);
    expect(repository.delete).toHaveBeenCalledWith(employee._id);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ data: employee }));
  });

  it.each(['get', 'update', 'delete'] as const)('%s comunica 404 si no existe el ID', async method => {
    repository.findById.mockResolvedValue(null);
    repository.update.mockResolvedValue(null);
    repository.delete.mockResolvedValue(null);
    await expect(controller[method](request, response, next)).rejects.toMatchObject({
      status: 404, message: 'Empleado no encontrado',
    });
    expect(json).not.toHaveBeenCalled();
  });

  it('propaga el fallo de persistencia al middleware sin responder con datos parciales', async () => {
    const failure = new AppError(503, 'Persistencia no disponible');
    repository.findAll.mockRejectedValue(failure);
    await expect(controller.list(request, response, next)).rejects.toBe(failure);
    expect(json).not.toHaveBeenCalled();
  });
});
