import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import type { IEmployeeRepository } from './repositories/employee.repository.js';
import { employeeRoutes } from './routes/empleados.routes.js';
import { errorHandler, AppError } from './middleware/error-handler.js';

// The HTTP layer receives persistence from the composition root.
export function createApp(repository: IEmployeeRepository, { logging = true } = {}) {
  const app = express();
  app.use(cors());
  if (logging) app.use(morgan('dev'));
  app.use(express.json({ limit: '100kb', strict: false }));
  app.use('/api/v1/employees', employeeRoutes(repository));
  app.use('/api/v1/empleados', employeeRoutes(repository));
  app.use((_req, _res, next) => next(new AppError(404, 'Ruta no encontrada')));
  app.use(errorHandler);
  return app;
}
