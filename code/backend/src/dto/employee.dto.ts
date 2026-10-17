import { z } from 'zod';

export const employeeDto = z.object({
  nombre: z.string().trim().min(3).max(100),
  cargo: z.string().trim().min(2).max(100),
  departamento: z.string().trim().min(2).max(100),
  sueldo: z.number().finite().nonnegative(),
}).strict();
export const updateEmployeeDto = employeeDto.partial().refine(
  data => Object.keys(data).length > 0, { message: 'Debe enviar al menos un campo' },
);
export const employeeParamsDto = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'El ID debe contener 24 caracteres hexadecimales'),
}).strict();
export const employeeQueryDto = z.object({
  page: z.coerce.number().int().min(1).max(1000000).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
}).strict().transform(query => query.page !== undefined || query.limit !== undefined
  ? { page: query.page ?? 1, limit: query.limit ?? 10 } : {});
