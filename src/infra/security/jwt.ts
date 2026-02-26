import jwt from 'jsonwebtoken';
import { Credentials } from '../../presentation/helpers/credentials';

export const signToken = (payload: object): string =>
    jwt.sign(payload, Credentials.JwtSecret, { expiresIn: Credentials.JwtExpiresIn as any });

export const verifyToken = (token: string): any =>
    jwt.verify(token, Credentials.JwtSecret);
