import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { IAuthRepository } from '../repositories/auth.repository.js';
import type { Credentials } from '../domain/user.js';
import { success } from '../http/api-response.js';
import { AppError } from '../middleware/error-handler.js';

export class AuthController {
  constructor(private readonly repository: IAuthRepository, private readonly secret: string) {}

  register = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = res.locals.body as Credentials;
      if (await this.repository.findByEmail(email)) throw new AppError(409, 'El correo electrónico ya está registrado');
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await this.repository.createUser({ email, passwordHash, rol: 'alumno' });
      res.status(201).json(success({ email: user.email, rol: user.rol }, 'Cuenta creada. Inicie sesión'));
    } catch (error) {
      // The unique index also handles concurrent registration of the same email.
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
        next(new AppError(409, 'El correo electrónico ya está registrado'));
      } else next(error);
    }
  };

  login = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = res.locals.body as Credentials;
      const user = await this.repository.findByEmail(email);
      if (!user || !await bcrypt.compare(password, user.passwordHash)) {
        throw new AppError(401, 'Correo electrónico o contraseña incorrectos');
      }
      const token = jwt.sign({ id: user.id, rol: user.rol }, this.secret, { algorithm: 'HS256', expiresIn: '2h' });
      res.json(success({ token, user: { email: user.email, rol: user.rol } }, 'Sesión iniciada'));
    } catch (error) { next(error); }
  };
}
