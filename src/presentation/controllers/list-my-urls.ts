import { Shortener } from '../../domain/entities/shortener';
import { HttpResponse } from '../contracts/http';
import { serverError, success } from '../contracts/response';

interface ListMyUrlsRepository {
    list: (ownerId: string) => Promise<Partial<Shortener>[]>
}

export class HandleListMyUrlsController {
    constructor(private readonly repository: ListMyUrlsRepository) {}

    async handle(ownerId: string): Promise<HttpResponse<Partial<Shortener>[]>> {
        try {
            const urls = await this.repository.list(ownerId);
            return success(urls);
        } catch (error: any) {
            return serverError(error.message);
        }
    }
}
