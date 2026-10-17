import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import type { ApiResponse } from '../http/api-response.js';

export class AppError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}
export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  let status = 500;
  const body: ApiResponse<never> = {
    success: false, message: 'Error interno del servidor', data: null, errors: [],
  };
  if (error instanceof ZodError) {
    status = 400;
    body.message = 'Datos de entrada inválidos';
    body.errors = error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message }));
  } else if (error instanceof AppError) {
    status = error.status;
    body.message = error.message;
  } else if (typeof error === 'object' && error !== null && 'type' in error) {
    if (error.type === 'entity.parse.failed') {
      status = 400;
      body.message = 'El cuerpo debe ser JSON válido';
    } else if (error.type === 'entity.too.large') {
      status = 413;
      body.message = 'El cuerpo de la petición es demasiado grande';
    }
  }
  if (status === 500) console.error('Error no controlado:', error);
  res.status(status).json(body);
};
