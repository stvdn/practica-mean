import type { RequestHandler } from 'express';
import type { IEmployeeRepository } from '../repositories/employee.repository.js';
import { AppError } from '../middleware/error-handler.js';
import { success } from '../http/api-response.js';
import type { EmployeeQuery } from '../domain/employee.js';

export class EmployeeController {
  constructor(private readonly repository: IEmployeeRepository) {}
  list: RequestHandler = async (_req, res) => {
    const query: EmployeeQuery = res.locals.query;
    const result = await this.repository.findAll(query);
    const response = success(result.employees, 'Empleados consultados');
    if (query.limit !== undefined) response.meta = {
      total: result.total, page: query.page ?? 1, limit: query.limit,
      pages: Math.ceil(result.total / query.limit),
    };
    res.json(response);
  };
  get: RequestHandler = async (_req, res) => {
    const employee = await this.repository.findById(res.locals.params.id);
    if (!employee) throw new AppError(404, 'Empleado no encontrado');
    res.json(success(employee, 'Empleado consultado'));
  };
  create: RequestHandler = async (_req, res) => {
    const employee = await this.repository.create(res.locals.body);
    res.status(201).json(success(employee, 'Empleado creado'));
  };
  update: RequestHandler = async (_req, res) => {
    const employee = await this.repository.update(res.locals.params.id, res.locals.body);
    if (!employee) throw new AppError(404, 'Empleado no encontrado');
    res.json(success(employee, 'Empleado actualizado'));
  };
  delete: RequestHandler = async (_req, res) => {
    const employee = await this.repository.delete(res.locals.params.id);
    if (!employee) throw new AppError(404, 'Empleado no encontrado');
    res.json(success(employee, 'Empleado eliminado'));
  };
}
