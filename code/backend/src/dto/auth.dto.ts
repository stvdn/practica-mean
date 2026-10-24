import { z } from 'zod';

export const credentialsDto = z.object({
  email: z.string().trim().toLowerCase().email('Ingrese un correo electrónico válido').max(254),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
    .refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'La contraseña no puede superar 72 bytes UTF-8'),
}).strict();
