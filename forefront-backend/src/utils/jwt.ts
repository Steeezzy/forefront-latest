import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signToken = (payload: object) => {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, env.JWT_SECRET);
    } catch (e) {
        return null;
    }
};
