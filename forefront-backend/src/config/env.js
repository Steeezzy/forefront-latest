"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
var dotenv = require("dotenv");
var zod_1 = require("zod");
dotenv.config();
var envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('3001'),
    DATABASE_URL: zod_1.z.string().default('postgres://postgres:password@localhost:5433/forefront'),
    REDIS_URL: zod_1.z.string().default('redis://localhost:6379'),
    JWT_SECRET: zod_1.z.string().default('dev_secret_key_change_in_prod'),
    OPENAI_API_KEY: zod_1.z.string().optional(),
    SARVAM_API_KEY: zod_1.z.string().optional(),
    STRIPE_SECRET_KEY: zod_1.z.string().optional(),
});
exports.env = envSchema.parse(process.env);
