import Redis from 'ioredis';
import { env } from './env.js';

let redisInstance: any = null;

if (env.REDIS_URL) {
    console.log('[Redis] Connecting to Redis...');
    redisInstance = new (Redis as any)(env.REDIS_URL, {
        lazyConnect: true,
        tls: env.REDIS_URL.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined
    });

    redisInstance.on('error', (err: any) => {
        console.error('Redis Client Error', err);
    });

    redisInstance.on('connect', () => {
        console.log('Redis Client Connected');
    });
} else {
    console.warn('[Redis] No REDIS_URL provided. Redis features will be disabled.');
    // Mock redis for development or when not needed
    redisInstance = {
        get: async () => null,
        set: async () => 'OK',
        setex: async () => 'OK',
        del: async () => 0,
        on: () => { }
    };
}

export const redis = redisInstance;
