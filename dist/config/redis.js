"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRedisConnection = void 0;
const ioredis_1 = require("ioredis");
const index_1 = require("./index");
const createRedisConnection = () => {
    const redis = new ioredis_1.Redis({
        host: index_1.config.redis.host,
        port: index_1.config.redis.port,
        password: index_1.config.redis.password,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
    });
    redis.on('connect', () => {
        console.log('Redis connected');
    });
    redis.on('error', (error) => {
        console.error('Redis connection error:', error);
    });
    redis.on('close', () => {
        console.log('Redis connection closed');
    });
    return redis;
};
exports.createRedisConnection = createRedisConnection;
