import { Response } from 'express';
import { ZodError } from 'zod';

// A small, consistent way to send success and error responses.

export function ok(res: Response, data: unknown, status = 200) {
  return res.status(status).json(data);
}

export function fail(res: Response, status: number, message: string, extra?: unknown) {
  return res.status(status).json({ error: message, ...(extra ? { details: extra } : {}) });
}

// Wraps an async route handler so thrown errors become clean 4xx/5xx responses
// instead of crashing the server.
import { RequestHandler } from 'express';

export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export class HttpError extends Error {
  status: number;
  extra?: unknown;
  constructor(status: number, message: string, extra?: unknown) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export function zodToMessage(err: ZodError): { message: string; details: unknown } {
  return {
    message: 'Invalid request data',
    details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
  };
}

// Send a 400 for a failed zod parse in one line.
export function failValidation(res: Response, err: ZodError) {
  const { message, details } = zodToMessage(err);
  return fail(res, 400, message, details);
}
