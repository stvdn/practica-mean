import type { Employee, EmployeeData, EmployeeList, EmployeeQuery } from '../domain/employee.js';

export interface IEmployeeRepository {
  findAll(query: EmployeeQuery): Promise<EmployeeList>;
  findById(id: string): Promise<Employee | null>;
  create(data: EmployeeData): Promise<Employee>;
  update(id: string, data: Partial<EmployeeData>): Promise<Employee | null>;
  delete(id: string): Promise<Employee | null>;
}
