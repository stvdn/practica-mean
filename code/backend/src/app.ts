import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import type { IEmployeeRepository } from './repositories/employee.repository.js';
import { employeeRoutes } from './routes/empleados.routes.js';
import { errorHandler, AppError } from './middleware/error-handler.js';
import type { IAuthRepository } from './repositories/auth.repository.js';
import { MongoAuthRepository } from './repositories/mongo-auth.repository.js';
import { authRoutes } from './routes/auth.routes.js';
import { authenticateJWT } from './middleware/auth.js';
import { getJwtSecret } from './config/auth.js';

interface AppOptions { logging?: boolean; authRepository?: IAuthRepository; jwtSecret?: string }

// The HTTP layer receives persistence from the composition root.
export function createApp(repository: IEmployeeRepository, options: AppOptions = {}) {
  const { logging = true, authRepository = new MongoAuthRepository(), jwtSecret = getJwtSecret() } = options;
  const app = express();
  app.use(cors());
  if (logging) app.use(morgan('dev'));
  app.use(express.json({ limit: '100kb', strict: false }));
  app.use('/api/v1/auth', authRoutes(authRepository, jwtSecret));
  app.use('/api/v1/employees', authenticateJWT(jwtSecret), employeeRoutes(repository));
  app.use('/api/v1/empleados', authenticateJWT(jwtSecret), employeeRoutes(repository));
  app.use((_req, _res, next) => next(new AppError(404, 'Ruta no encontrada')));
  app.use(errorHandler);
  return app;
}
