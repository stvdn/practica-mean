import { Router } from 'express';
import type { IAuthRepository } from '../repositories/auth.repository.js';
import { AuthController } from '../controllers/auth.controllers.js';
import { credentialsDto } from '../dto/auth.dto.js';
import { validate } from '../middleware/validate.js';

export function authRoutes(repository: IAuthRepository, secret: string) {
  const router = Router();
  const controller = new AuthController(repository, secret);
  router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  router.post('/register', validate(credentialsDto, 'body'), controller.register);
  router.post('/login', validate(credentialsDto, 'body'), controller.login);
  return router;
}
