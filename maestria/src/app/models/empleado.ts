export interface EmpleadoData {
  readonly nombre: string;
  readonly cargo: string;
  readonly departamento: string;
  readonly sueldo: number;
}
export interface Empleado extends EmpleadoData {
  readonly _id: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: readonly { field: string; message: string }[];
}
