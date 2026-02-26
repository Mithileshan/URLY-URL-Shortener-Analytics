import express from 'express'
import os from 'os';
import { notFound } from '../../../presentation/contracts/response';
import { Credentials } from '../../../presentation/helpers/credentials';
import { authMiddleware, AuthRequest } from '../../../presentation/middleware/auth';
import { redisClient } from '../../../infra/cache/redis.client';
import { MongooseTrackClickRepository } from '../../../infra/repositories/mongoose/track-click';
import { makeAuthController } from '../../factories/mongodb/auth';
import { makeCreateShortenerController } from '../../factories/mongodb/create-shortener';
import { makeRedirectShortenerController } from '../../factories/mongodb/redirect-shortener';
import { makeGetStatsController } from '../../factories/mongodb/get-stats';
import { makeListMyUrlsController } from '../../factories/mongodb/list-my-urls';

const REDIRECT_TTL = 60 * 60; // 1 hour

const app = express()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const trackClickRepo = new MongooseTrackClickRepository();

// ─── Auth ────────────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    const controller = makeAuthController();
    const httpResponse = await controller.register(name, email, password);
    res.status(httpResponse.statusCode).json(httpResponse.data);
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const controller = makeAuthController();
    const httpResponse = await controller.login(email, password);
    res.status(httpResponse.statusCode).json(httpResponse.data);
});

// ─── URL Management (protected) ──────────────────────────────────────────────

app.post('/api/url', authMiddleware, async (req: AuthRequest, res) => {
    const long_url = req.body.long_url;
    const ownerId = req.user!.id;
    const controller = makeCreateShortenerController();
    const httpResponse = await controller.handle(long_url, ownerId);
    res.status(httpResponse.statusCode).json(httpResponse.data);
});

app.get('/api/url/mine', authMiddleware, async (req: AuthRequest, res) => {
    const ownerId = req.user!.id;
    const controller = makeListMyUrlsController();
    const httpResponse = await controller.handle(ownerId);
    res.status(httpResponse.statusCode).json(httpResponse.data);
});

app.get('/api/url/:shortCode/stats', authMiddleware, async (req: AuthRequest, res) => {
    const { shortCode } = req.params;
    const requestingUserId = req.user!.id;
    const controller = makeGetStatsController();
    const httpResponse = await controller.handle(shortCode, requestingUserId);
    res.status(httpResponse.statusCode).json(httpResponse.data);
});

// ─── Public redirect ─────────────────────────────────────────────────────────

app.get('/:short_url', async (req, res) => {
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
