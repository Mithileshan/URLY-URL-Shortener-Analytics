import { UrlStats } from '../../domain/entities/click';
import { HttpResponse } from '../contracts/http';
import { notFound, serverError, success } from '../contracts/response';

interface GetStatsRepository {
    getStats: (shortCode: string) => Promise<UrlStats | null>
}

export class HandleGetStatsController {
    constructor(private readonly repository: GetStatsRepository) {}

    async handle(shortCode: string): Promise<HttpResponse<UrlStats>> {
        try {
            const stats = await this.repository.getStats(shortCode);
            if (!stats) return notFound('URL not found');
            return success(stats);
        } catch (error: any) {
            return serverError(error.message);
        }
    }
}
