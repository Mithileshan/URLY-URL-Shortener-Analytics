import { MongooseListMyUrlsRepository } from '../../../infra/repositories/mongoose/list-my-urls';
import { HandleListMyUrlsController } from '../../../presentation/controllers/list-my-urls';

export const makeListMyUrlsController = () => {
    const repo = new MongooseListMyUrlsRepository();
    return new HandleListMyUrlsController(repo);
};
