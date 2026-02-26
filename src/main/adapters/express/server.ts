import express from 'express'
import os from 'os';
import { notFound } from '../../../presentation/contracts/response';
import { Credentials } from '../../../presentation/helpers/credentials';
import { redisClient } from '../../../infra/cache/redis.client';
import { MongooseTrackClickRepository } from '../../../infra/repositories/mongoose/track-click';
import { makeCreateShortenerController } from '../../factories/mongodb/create-shortener';
import { makeRedirectShortenerController } from '../../factories/mongodb/redirect-shortener';
import { makeGetStatsController } from '../../factories/mongodb/get-stats';

const REDIRECT_TTL = 60 * 60; // 1 hour

const app = express()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
 * Returns click analytics for a shortened URL (cached 5 min)
 */
app.get('/api/url/:shortCode/stats', async (req: express.Request, res: express.Response) => {
    const { shortCode } = req.params;
    const controller = makeGetStatsController();
    const httpResponse = await controller.handle(shortCode);
    res.status(httpResponse.statusCode).json(httpResponse.data);
});

/**
 * GET /:short_url
 * Redirects to original URL, tracks click, and invalidates stats cache
 */
app.get('/:short_url', async (req: express.Request, res: express.Response) => {
    const short_url = req.params.short_url;
    const controller = makeRedirectShortenerController();

    const clickMeta = {
        shortCode: short_url,
        ip: req.ip || req.socket.remoteAddress || '',
        userAgent: req.headers['user-agent'] || '',
        referrer: (req.headers['referer'] as string) || '',
        timestamp: new Date(),
    };

    const cachedURL = await redisClient.get(`redirect:${short_url}`);

    if (cachedURL) {
        res.status(301).redirect(cachedURL);
        trackClickRepo.track(clickMeta).catch(() => {});
        redisClient.del(`stats:${short_url}`).catch(() => {});
    } else {
        const httpResponse = await controller.handle(`${Credentials.PrefixUrl}${short_url}`);
        if (httpResponse.statusCode === 200) {
            res.status(301).redirect(httpResponse.data);
            redisClient.set(`redirect:${short_url}`, httpResponse.data, REDIRECT_TTL).catch(() => {});
            trackClickRepo.track(clickMeta).catch(() => {});
            redisClient.del(`stats:${short_url}`).catch(() => {});
        } else {
            res.status(404).json(notFound('URL not found'));
        }
    }
});

const api = app.listen(Credentials.Port, async () => {
    console.log(`URLY running at http://${os.hostname()}:${Credentials.Port}`)
})

export default api;
