"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
    },
    comfyui: {
        baseUrl: process.env.COMFYUI_BASE_URL || 'http://localhost:8188',
        timeout: parseInt(process.env.COMFYUI_API_TIMEOUT || '30000', 10),
    },
    worker: {
        concurrency: parseInt(process.env.WORKER_CONCURRENCY || '1', 10),
        pollingInterval: parseInt(process.env.POLLING_INTERVAL || '1000', 10),
        maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
    },
    storage: {
        type: process.env.IMAGE_STORAGE_TYPE || 'base64', // 'base64' or 'file'
        path: process.env.IMAGE_STORAGE_PATH || '/tmp/images',
        baseUrl: process.env.IMAGE_BASE_URL || 'http://localhost:3000/images',
    },
};
