import { Shortener } from "../entities/shortener"

export interface CreateShortener {
    create: (long_url: string, ownerId: string) => Promise<Shortener>
}