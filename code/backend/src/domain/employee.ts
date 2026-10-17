export interface EmployeeData {
  nombre: string;
  cargo: string;
  departamento: string;
  sueldo: number;
}
export interface Employee extends EmployeeData {
  _id: string;
  createdAt: string;
  updatedAt: string;
}
export interface EmployeeQuery { page?: number; limit?: number; }
export interface EmployeeList { employees: Employee[]; total: number; }
