import { Shortener } from "../../domain/entities/shortener"
import { CreateShortener } from "../../domain/usecases/create-shortener"
import { CreateShortenerController } from "../contracts/controller"
import { HttpResponse } from "../contracts/http"
import { badRequest, serverError, success } from "../contracts/response"
import { ErrorMessages } from "../errors/error-messages"
import { Credentials } from "../helpers/credentials"

export class HandleCreateShortenerController implements CreateShortenerController {

    constructor(private readonly createShortener: CreateShortener) {}

    async handle(long_url: string, ownerId: string): Promise<HttpResponse<Shortener>> {

        if (!long_url)
            return badRequest(ErrorMessages.InvalidUrl)

        if (long_url.length > Credentials.MaxBytesLongUrl)
            return badRequest(ErrorMessages.LongUrlMaxSizeExceeded)

        try {
            new URL(long_url)
        } catch {
            return badRequest(ErrorMessages.InvalidUrl)
        }

        try {
            const shortener = await this.createShortener.create(long_url, ownerId)
            return success(shortener)
        } catch (error: any) {
            return serverError(error.message)
        }
    }
}