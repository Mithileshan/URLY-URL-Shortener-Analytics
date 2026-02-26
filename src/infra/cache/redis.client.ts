import { createClient } from 'redis';
import { Credentials } from '../../presentation/helpers/credentials';

class RedisClient {
    private client: ReturnType<typeof createClient> | null = null;

    constructor() {
        if (!Credentials.RedisUrl) {
            console.warn('[Redis] REDIS_URL not configured — caching disabled');
            return;
        }

        this.client = createClient({ url: Credentials.RedisUrl });

        this.client.on('error', (err: any) => {
            console.error('[Redis] Error:', err.message);
        });

        this.client.connect()
            .then(() => console.log('[Redis] Connected'))
            .catch((err: any) => {
                console.warn('[Redis] Could not connect — caching disabled:', err.message);
                this.client = null;
            });
    }

    private get ready(): boolean {
        return this.client?.isReady ?? false;
    }

    async get(key: string): Promise<string | null> {
        if (!this.ready) return null;
        try {
            return await this.client!.get(key);
        } catch {
            return null;
        }
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (!this.ready) return;
        try {
            await this.client!.set(key, value, ttlSeconds ? { EX: ttlSeconds } : undefined);
        } catch {}
    }

    async del(key: string): Promise<void> {
        if (!this.ready) return;
        try {
            await this.client!.del(key);
        } catch {}
    }
}

export const redisClient = new RedisClient();
