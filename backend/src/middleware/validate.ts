import type { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';
import type { ZodSchema } from 'zod';

/** Wrap an async route handler so thrown errors hit the error middleware. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

/** Validate req.body against a zod schema; on failure returns the first issue as one toast-ready line. */
export const validateBody =
  <T>(schema: ZodSchema<T>): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issue = result.error.issues[0];
      const field = issue?.path?.length ? issue.path.join('.') : null;
      const msg = issue?.message || 'Invalid request';
      const error = field ? `${field}: ${msg}` : msg;
      res.status(400).json({ error });
      return;
    }
    req.body = result.data;
    next();
  };

export class HttpError extends Error {
  status: number;
  publicMessage: string;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.publicMessage = message;
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('[api error]', err);
  const status = (err as HttpError)?.status || 500;
  res.status(status).json({ error: (err as HttpError)?.publicMessage || 'Internal server error' });
};
