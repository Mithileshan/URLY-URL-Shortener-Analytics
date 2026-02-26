export type Shortener = {
    long_url: string
    short_url: string
    clicks: number
    ownerId: string
    expiresAt: Date
    createdAt: Date
}