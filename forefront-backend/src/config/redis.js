"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
var ioredis_1 = require("ioredis");
var env_js_1 = require("./env.js");
exports.redis = new ioredis_1.default(env_js_1.env.REDIS_URL);
exports.redis.on('error', function (err) {
    console.error('Redis Client Error', err);
});
exports.redis.on('connect', function () {
    console.log('Redis Client Connected');
});
