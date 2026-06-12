import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { config } from '../config.js';
import type { AuthUser, JwtPayload } from '../types/models.js';

export function signToken(user: { id: number; role: AuthUser['role']; name: string | null }): string {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.name || '' },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn } as SignOptions
  );
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}
