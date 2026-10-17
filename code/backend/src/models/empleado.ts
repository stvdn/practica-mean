import { Schema, model } from 'mongoose';
import type { EmployeeData } from '../domain/employee.js';

interface StoredEmployee extends EmployeeData {
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<StoredEmployee>({
  nombre: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
  cargo: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  departamento: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  sueldo: { type: Number, required: true, min: 0 },
}, { timestamps: true, versionKey: false });

// Preserve the existing collection.
export const EmployeeModel = model('Empleado', employeeSchema);
