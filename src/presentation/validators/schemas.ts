import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const registerSchema = z.object({
    name:     z.string().min(1,  'Name is required'),
    email:    z.string().email('Invalid email address'),
    password: z.string().min(6,  'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
    email:    z.string().email('Invalid email address'),
    password: z.string().min(1,  'Password is required'),
});

export const createUrlSchema = z.object({
    long_url: z.string().url('Invalid URL — must include protocol (e.g. https://example.com)'),
});

export const validate = (schema: z.ZodSchema) =>
    (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: result.error.issues[0].message,
                },
            });
            return;
        }
        req.body = result.data;
        next();
    };
