import { Request, Response, NextFunction } from 'express';
import { verifyToken, AuthService } from '../services/auth.service.js';
import { IUserSummary } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: IUserSummary & { friendsCount?: number; pendingRequestsCount?: number };
}

export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Not authorized: No token provided',
      });
      return;
    }

    const decoded = verifyToken(token);
    const user = await AuthService.getCurrentUser(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Not authorized: User no longer exists',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: 'Not authorized: Invalid or expired token',
    });
  }
};

