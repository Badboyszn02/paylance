import type { AuthUser } from './models.js';

// Attach our authenticated user to Express's Request.
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
