import { Request, Response, NextFunction } from 'express';
import { logger } from '../../infra/logging/logger';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
    logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
    res.status(500).json({
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: process.env['NODE_ENV'] === 'production'
                ? 'Internal server error'
                : err.message,
        },
    });
};
