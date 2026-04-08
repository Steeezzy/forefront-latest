import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().default('3001'),
    DATABASE_URL: z.string().default('postgres://postgres:password@localhost:5433/forefront'),
    REDIS_URL: z.string().default('redis://localhost:6379'),
    DB_POOL_MAX: z.string().optional(),
    DB_POOL_MIN: z.string().optional(),
    DB_POOL_CONNECTION_TIMEOUT_MS: z.string().optional(),
    DB_POOL_IDLE_TIMEOUT_MS: z.string().optional(),
    DB_POOL_STATEMENT_TIMEOUT_MS: z.string().optional(),
    DB_POOL_QUERY_TIMEOUT_MS: z.string().optional(),
    DB_POOL_MAX_USES: z.string().optional(),
    JWT_SECRET: z.string().default('dev_secret_key_change_in_prod'),
    OPENAI_API_KEY: z.string().optional(),
    CLAUDE_API_KEY: z.string().optional(),
    SARVAM_API_KEY: z.string().optional(),
    STRIPE_SECRET_KEY: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_PHONE_NUMBER: z.string().optional(),
    BACKEND_URL: z.string().default('http://localhost:3001'),
    FRONTEND_URL: z.string().default('http://localhost:3000'),
});

export const env = envSchema.parse(process.env);
