import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'prop_excel_super_secure_cto_level_jwt_secret_key_123!';

export interface UserPayload {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  permission_to_crud: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}


export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access token is missing or invalid' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Access token is expired or invalid' });
  }
};


export const isAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin role required' });
  }

  next();
};


export const canCRUDProducts = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const hasAdminRole = req.user.role === 'admin';
  const hasCrudPermission = req.user.permission_to_crud === true;

  if (!hasAdminRole && !hasCrudPermission) {
    return res.status(403).json({ 
      message: 'Access denied: You do not have permission to modify products' 
    });
  }

  next();
};
