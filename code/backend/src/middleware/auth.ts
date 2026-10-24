import type { Request, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error-handler.js';

export interface AuthRequest extends Request { user?: { id: string; rol: string } }

export function authenticateJWT(secret: string): RequestHandler {
  return (req: AuthRequest, _res, next) => {
    const header = req.headers.authorization;
    if (!header) return next(new AppError(401, 'Debe iniciar sesión para continuar'));
    const match = /^Bearer ([^\s]+)$/i.exec(header);
    if (!match?.[1]) return next(new AppError(403, 'El token de autenticación es inválido'));
    try {
      const payload = jwt.verify(match[1], secret, { algorithms: ['HS256'] });
      if (typeof payload === 'string' || typeof payload.id !== 'string' || !payload.id
        || typeof payload.rol !== 'string' || !payload.rol || typeof payload.exp !== 'number') {
        throw new Error('Claims inválidos');
      }
      req.user = { id: payload.id, rol: payload.rol };
      next();
    } catch {
      next(new AppError(403, 'La sesión expiró o el token es inválido. Inicie sesión nuevamente'));
    }
  };
}
