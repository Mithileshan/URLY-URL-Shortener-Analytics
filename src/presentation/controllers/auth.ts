import { AuthToken } from '../../domain/entities/user';
import { HttpResponse } from '../contracts/http';
import { badRequest, serverError, success, unauthorized } from '../contracts/response';

interface AuthRepository {
    register(name: string, email: string, password: string): Promise<AuthToken | null>
    login(email: string, password: string): Promise<AuthToken | null>
}

export class HandleAuthController {
    constructor(private readonly repository: AuthRepository) {}

    async register(name: string, email: string, password: string): Promise<HttpResponse<AuthToken>> {
        if (!name?.trim() || !email?.trim() || !password)
            return badRequest('Name, email, and password are required');

        if (password.length < 6)
            return badRequest('Password must be at least 6 characters');

        try {
            const result = await this.repository.register(name.trim(), email.trim(), password);
            if (!result) return badRequest('Email is already registered');
            return success(result);
        } catch (error: any) {
            return serverError(error.message);
        }
    }

    async login(email: string, password: string): Promise<HttpResponse<AuthToken>> {
        if (!email?.trim() || !password)
            return badRequest('Email and password are required');

        try {
            const result = await this.repository.login(email.trim(), password);
            if (!result) return unauthorized();
            return success(result);
        } catch (error: any) {
            return serverError(error.message);
        }
    }
}
