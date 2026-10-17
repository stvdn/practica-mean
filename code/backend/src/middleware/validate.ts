import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

export function validate(schema: ZodType, source: 'body' | 'params' | 'query'): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return next(result.error);
    // Express 5 exposes query as a getter; store parsed values separately.
    res.locals[source] = result.data;
    next();
  };
}
