import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { JWTPayload, AuthenticatedRequest } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Verify JWT token middleware
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'] as string;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access token required'
    });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: jwt.VerifyErrors | null, decoded: any) => {
    if (err) {
      res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
      return;
    }

    const payload = decoded as JWTPayload;
    req.user = {
      uid: payload.uid,
      evm_address: payload.evm_address,
      publickeyhash: payload.publickeyhash
    };

    next();
  });
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'] as string;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = undefined;
    next();
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: jwt.VerifyErrors | null, decoded: any) => {
    if (err) {
      req.user = undefined;
    } else {
      const payload = decoded as JWTPayload;
      req.user = {
        uid: payload.uid,
        evm_address: payload.evm_address,
        publickeyhash: payload.publickeyhash
      };
    }
    next();
  });
};