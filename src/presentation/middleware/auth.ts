import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../infra/security/jwt';

export interface AuthRequest extends Request {
    user?: { id: string; email: string }
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Missing or invalid Authorization header' });
        return;
    }

    const token = header.slice(7);
    try {
        const decoded = verifyToken(token) as { id: string; email: string };
        req.user = { id: decoded.id, email: decoded.email };
        next();
    } catch {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};
