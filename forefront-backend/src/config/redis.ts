import Redis from 'ioredis';
import { env } from './env.js';

export const redis = new (Redis as any)(env.REDIS_URL, {
    lazyConnect: true
});

redis.on('error', (err) => {
    console.error('Redis Client Error', err);
});

redis.on('connect', () => {
    console.log('Redis Client Connected');
});
