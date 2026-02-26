import { connect } from 'mongoose';
import { Shortener } from '../../../domain/entities/shortener';
import { Credentials } from '../../../presentation/helpers/credentials';
import { ShortenerSchema } from './schemas/shortener';

export class MongooseListMyUrlsRepository {
    async list(ownerId: string): Promise<Partial<Shortener>[]> {
        const db = await connect(Credentials.DatabaseURI);
        const urls = await ShortenerSchema
            .find({ ownerId })
            .sort({ createdAt: -1 })
            .select('long_url short_url clicks createdAt expiresAt -_id')
            .exec();
        db.disconnect();
        return urls;
    }
}
