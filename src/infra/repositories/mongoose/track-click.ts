import { connect } from 'mongoose';
import { Click } from '../../../domain/entities/click';
import { Credentials } from '../../../presentation/helpers/credentials';
import { ClickModel } from './schemas/click';

export class MongooseTrackClickRepository {
    async track(click: Click): Promise<void> {
        const db = await connect(Credentials.DatabaseURI);
        await new ClickModel(click).save();
        db.disconnect();
    }
}
