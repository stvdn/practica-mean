import type { Employee, EmployeeData, EmployeeQuery } from '../domain/employee.js';
import type { IEmployeeRepository } from './employee.repository.js';
import { EmployeeModel } from '../models/empleado.js';

function toEmployee(document: { _id: { toString(): string }; nombre: string; cargo: string;
  departamento: string; sueldo: number; createdAt: Date; updatedAt: Date }): Employee {
  return { _id: document._id.toString(), nombre: document.nombre, cargo: document.cargo,
    departamento: document.departamento, sueldo: document.sueldo,
    createdAt: document.createdAt.toISOString(), updatedAt: document.updatedAt.toISOString() };
}
export class MongoEmployeeRepository implements IEmployeeRepository {
  async findAll(query: EmployeeQuery) {
    let cursor = EmployeeModel.find().sort({ _id: 1 });
    if (query.limit !== undefined) cursor = cursor.skip(((query.page ?? 1) - 1) * query.limit).limit(query.limit);
    const [documents, total] = await Promise.all([cursor.exec(), EmployeeModel.countDocuments()]);
    return { employees: documents.map(toEmployee), total };
  }
  async findById(id: string) {
    const document = await EmployeeModel.findById(id);
    return document ? toEmployee(document) : null;
  }
  async create(data: EmployeeData) { return toEmployee(await EmployeeModel.create(data)); }
  async update(id: string, data: Partial<EmployeeData>) {
    const document = await EmployeeModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
    return document ? toEmployee(document) : null;
  }
  async delete(id: string) {
    const document = await EmployeeModel.findByIdAndDelete(id);
    return document ? toEmployee(document) : null;
  }
}
