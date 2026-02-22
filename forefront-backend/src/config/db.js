"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.pool = void 0;
var pg_1 = require("pg");
var env_js_1 = require("./env.js");
exports.pool = new pg_1.Pool({
    connectionString: env_js_1.env.DATABASE_URL,
});
exports.pool.on('error', function (err) {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
var query = function (text, params) { return exports.pool.query(text, params); };
exports.query = query;
