import { connect } from 'mongoose';
import { AuthToken } from '../../../domain/entities/user';
import { Credentials } from '../../../presentation/helpers/credentials';
import { hashPassword, verifyPassword } from '../../security/password';
import { signToken } from '../../security/jwt';
import { UserModel } from './schemas/user';

export class MongooseAuthRepository {
    async register(name: string, email: string, password: string): Promise<AuthToken | null> {
        const db = await connect(Credentials.DatabaseURI);

        const existing = await UserModel.findOne({ email: email.toLowerCase() }).exec();
        if (existing) {
            db.disconnect();
            return null;
        }

        const passwordHash = await hashPassword(password);
        const user = await new UserModel({ name, email, passwordHash }).save();
        db.disconnect();

        const token = signToken({ id: user._id.toString(), email: user.email });
        return { token, user: { id: user._id.toString(), name: user.name, email: user.email } };
    }

    async login(email: string, password: string): Promise<AuthToken | null> {
        const db = await connect(Credentials.DatabaseURI);

        const user = await UserModel.findOne({ email: email.toLowerCase() }).exec();
        if (!user) {
            db.disconnect();
            return null;
        }

        const valid = await verifyPassword(password, user.passwordHash);
        db.disconnect();

        if (!valid) return null;

        const token = signToken({ id: user._id.toString(), email: user.email });
        return { token, user: { id: user._id.toString(), name: user.name, email: user.email } };
    }
}
