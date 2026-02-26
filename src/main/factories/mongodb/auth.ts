import { MongooseAuthRepository } from '../../../infra/repositories/mongoose/auth';
import { HandleAuthController } from '../../../presentation/controllers/auth';

export const makeAuthController = () => {
    const repo = new MongooseAuthRepository();
    return new HandleAuthController(repo);
};
