import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().default('3001'),
    DATABASE_URL: z.string().default('postgres://postgres:password@localhost:5433/forefront'),
    REDIS_URL: z.string().default('redis://localhost:6379'),
    JWT_SECRET: z.string().default('dev_secret_key_change_in_prod'),
    OPENAI_API_KEY: z.string().optional(),
    SARVAM_API_KEY: z.string().optional(),
    STRIPE_SECRET_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
