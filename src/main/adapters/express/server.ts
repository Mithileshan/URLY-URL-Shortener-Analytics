import express from 'express'
import os from 'os';
import { notFound } from '../../../presentation/contracts/response';
import { Credentials } from '../../../presentation/helpers/credentials';
import { MongooseTrackClickRepository } from '../../../infra/repositories/mongoose/track-click';
import { makeCreateShortenerController } from '../../factories/mongodb/create-shortener';
import { makeRedirectShortenerController } from '../../factories/mongodb/redirect-shortener';
import { makeGetStatsController } from '../../factories/mongodb/get-stats';
import { RedisManager } from './controllers/redis';

const app = express()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const redisManager = new RedisManager({ url: Credentials.RedisUrl })
const trackClickRepo = new MongooseTrackClickRepository();

/**
 * POST /shorten
 * Body: { long_url: string }
 * Creates a shortened URL
 */
app.post('/shorten', async (req: express.Request, res: express.Response) => {
    const long_url = req.body.long_url;
    const controller = makeCreateShortenerController();
    const httpResponse = await controller.handle(long_url);
    res.status(httpResponse.statusCode).json(httpResponse.data);
});

/**
 * GET /api/url/:shortCode/stats
 * Returns click analytics for a shortened URL
 */
app.get('/api/url/:shortCode/stats', async (req: express.Request, res: express.Response) => {
    const { shortCode } = req.params;
    const controller = makeGetStatsController();
    const httpResponse = await controller.handle(shortCode);
    res.status(httpResponse.statusCode).json(httpResponse.data);
});

/**
 * GET /:short_url
 * Redirects to original URL and tracks the click
 */
app.get('/:short_url', async (req: express.Request, res: express.Response) => {
    const short_url = req.params.short_url;
    const controller = makeRedirectShortenerController();
    const cachedURL = await redisManager.get(short_url);

    if (cachedURL) {
        res.status(301).redirect(cachedURL);
        trackClickRepo.track({
            shortCode: short_url,
            ip: req.ip || req.socket.remoteAddress || '',
            userAgent: req.headers['user-agent'] || '',
            referrer: (req.headers['referer'] as string) || '',
            timestamp: new Date(),
        }).catch(() => {});
    } else {
        const httpResponse = await controller.handle(`${Credentials.PrefixUrl}${short_url}`);
        if (httpResponse.statusCode === 200) {
            await redisManager.set(short_url, httpResponse.data);
            res.status(301).redirect(httpResponse.data);
            trackClickRepo.track({
                shortCode: short_url,
                ip: req.ip || req.socket.remoteAddress || '',
                userAgent: req.headers['user-agent'] || '',
                referrer: (req.headers['referer'] as string) || '',
                timestamp: new Date(),
            }).catch(() => {});
        } else {
            res.status(404).json(notFound('URL not found'));
        }
    }
});

const api = app.listen(Credentials.Port, async () => {
    console.log(`URLY running at http://${os.hostname()}:${Credentials.Port}`)
})

export default api;
