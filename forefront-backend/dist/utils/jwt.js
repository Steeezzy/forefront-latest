import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export const signToken = (payload) => {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
};
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, env.JWT_SECRET);
    }
    catch (e) {
        return null;
    }
};
//# sourceMappingURL=jwt.js.map