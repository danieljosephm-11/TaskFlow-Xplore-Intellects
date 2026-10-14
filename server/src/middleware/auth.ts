import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DataService } from '../services/dataService.ts';
import { AuthUserPayload, UserRole } from '../types/index.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'xplore-intellects-taskflow-default-secret-2026';

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export const generateToken = (payload: AuthUserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
};

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. No authorization token provided.',
      });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err: any) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired session token. Please log in again.',
      });
      return;
    }

    // Verify user exists and is active
    const user = await DataService.findUserById(decoded.id);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Account associated with this session no longer exists.',
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact your system administrator.',
      });
      return;
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    };

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Authentication verification encountered an internal error.',
    });
  }
};

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. This operation requires one of the following roles: [${allowedRoles.join(', ')}].`,
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole('ADMIN');
export const requireEmployee = requireRole('EMPLOYEE');
