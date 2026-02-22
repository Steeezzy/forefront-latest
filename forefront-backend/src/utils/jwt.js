"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.signToken = void 0;
var jwt = require("jsonwebtoken");
var env_js_1 = require("../config/env.js");
var signToken = function (payload) {
    return jwt.sign(payload, env_js_1.env.JWT_SECRET, { expiresIn: '7d' });
};
exports.signToken = signToken;
var verifyToken = function (token) {
    try {
        return jwt.verify(token, env_js_1.env.JWT_SECRET);
    }
    catch (e) {
        return null;
    }
};
exports.verifyToken = verifyToken;
