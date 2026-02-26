import { MongooseGetStatsRepository } from '../../../infra/repositories/mongoose/get-stats';
import { HandleGetStatsController } from '../../../presentation/controllers/get-stats';

export const makeGetStatsController = () => {
    const repo = new MongooseGetStatsRepository();
    return new HandleGetStatsController(repo);
};
