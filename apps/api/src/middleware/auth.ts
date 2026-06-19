import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

export interface AuthPayload {
  id: string;
  role: 'passenger' | 'driver' | 'admin';
  email: string;
  tokenVersion?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;

    // Verificar versión del token en la base de datos
    const expectedVersion = payload.tokenVersion || 0;

    if (payload.role === 'driver') {
      const dbDriver = await prisma.driver.findUnique({
        where: { id: payload.id },
        select: { tokenVersion: true }
      });
      if (!dbDriver || dbDriver.tokenVersion !== expectedVersion) {
        return res.status(401).json({ error: 'Sesión iniciada en otro dispositivo' });
      }
    } else {
      const dbUser = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { tokenVersion: true }
      });
      if (!dbUser || dbUser.tokenVersion !== expectedVersion) {
        return res.status(401).json({ error: 'Sesión iniciada en otro dispositivo' });
      }
    }

    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Sin permisos suficientes' });
    }
    next();
  };
}

export function generateTokens(payload: AuthPayload) {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '7d',
  });

  return { accessToken };
}
