import { UrlStats } from '../../domain/entities/click';
import { HttpResponse } from '../contracts/http';
import { forbidden, notFound, serverError, success } from '../contracts/response';

interface GetStatsRepository {
    getStats: (shortCode: string, requestingUserId: string) => Promise<UrlStats | null | 'forbidden'>
}

export class HandleGetStatsController {
    constructor(private readonly repository: GetStatsRepository) {}

    async handle(shortCode: string, requestingUserId: string): Promise<HttpResponse<UrlStats>> {
        try {
            const stats = await this.repository.getStats(shortCode, requestingUserId);
            if (stats === 'forbidden') return forbidden('You do not own this URL');
            if (!stats) return notFound('URL not found');
            return success(stats);
        } catch (error: any) {
            return serverError(error.message);
        }
    }
}
