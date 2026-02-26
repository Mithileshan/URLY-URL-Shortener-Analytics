import express from 'express';
import os from 'os';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';

import { Credentials } from '../../../presentation/helpers/credentials';
import { sendResponse } from '../../../presentation/helpers/send-response';
import { authMiddleware, AuthRequest } from '../../../presentation/middleware/auth';
import { errorHandler } from '../../../presentation/middleware/error-handler';
import { validate, registerSchema, loginSchema, createUrlSchema } from '../../../presentation/validators/schemas';
import { logger } from '../../../infra/logging/logger';
import { redisClient } from '../../../infra/cache/redis.client';
import { MongooseTrackClickRepository } from '../../../infra/repositories/mongoose/track-click';
import { makeAuthController } from '../../factories/mongodb/auth';
import { makeCreateShortenerController } from '../../factories/mongodb/create-shortener';
import { makeRedirectShortenerController } from '../../factories/mongodb/redirect-shortener';
import { makeGetStatsController } from '../../factories/mongodb/get-stats';
import { makeListMyUrlsController } from '../../factories/mongodb/list-my-urls';

const REDIRECT_TTL = 60 * 60; // 1 hour

const app = express();

// ─── Security & parsing ───────────────────────────────────────────────────────
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Request logging ──────────────────────────────────────────────────────────
app.use(pinoHttp({ logger }));

// ─── Rate limiters ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, slow down' } },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many auth attempts, try again later' } },
});

const createUrlLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many URL creation requests, slow down' } },
});

app.use(globalLimiter);

// ─── Infra ────────────────────────────────────────────────────────────────────
const trackClickRepo = new MongooseTrackClickRepository();

// ─── Auth ─────────────────────────────────────────────────────────────────────

app.post('/api/auth/register', authLimiter, validate(registerSchema), async (req, res) => {
    const { name, email, password } = req.body;
    const controller = makeAuthController();
    const httpResponse = await controller.register(name, email, password);
    sendResponse(res, httpResponse);
});

app.post('/api/auth/login', authLimiter, validate(loginSchema), async (req, res) => {
    const { email, password } = req.body;
    const controller = makeAuthController();
    const httpResponse = await controller.login(email, password);
    sendResponse(res, httpResponse);
});

// ─── URL Management (protected) ───────────────────────────────────────────────

app.post('/api/url', authMiddleware, createUrlLimiter, validate(createUrlSchema), async (req: AuthRequest, res) => {
    const long_url = req.body.long_url;
    const ownerId = req.user!.id;
    const controller = makeCreateShortenerController();
    const httpResponse = await controller.handle(long_url, ownerId);
    sendResponse(res, httpResponse);
});

app.get('/api/url/mine', authMiddleware, async (req: AuthRequest, res) => {
    const ownerId = req.user!.id;
    const controller = makeListMyUrlsController();
    const httpResponse = await controller.handle(ownerId);
    sendResponse(res, httpResponse);
});

app.get('/api/url/:shortCode/stats', authMiddleware, async (req: AuthRequest, res) => {
    const { shortCode } = req.params;
    const requestingUserId = req.user!.id;
    const controller = makeGetStatsController();
    const httpResponse = await controller.handle(shortCode, requestingUserId);
    sendResponse(res, httpResponse);
});

// ─── Public redirect ──────────────────────────────────────────────────────────

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
            res.status(404).json({ error: { code: 'NOT_FOUND', message: 'URL not found or has expired' } });
        }
    }
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

const api = app.listen(Credentials.Port, () => {
    logger.info(`URLY running at http://${os.hostname()}:${Credentials.Port} [${Credentials.NodeEnv}]`);
});

export default api;
