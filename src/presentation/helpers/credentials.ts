import * as dotenv from 'dotenv'
dotenv.config()

export class Credentials  {
    static MaxBytesLongUrl = 2048
    static MaxBytesShortUrl = 11
    static MaxBytesFullShortUrl = 22
    static DatabaseURI = process.env['MONGO_URI'] || ''
    static PrefixUrl = process.env['BASE_URL'] || 'http://localhost:5000/'
    static ExpirationHour = Number(process.env['EXPIRATION_HOUR']) || 24
    static Port = Number(process.env['PORT']) || 5000
    static RedisUrl = process.env['REDIS_URL'] || 'redis://redis:6379'
}