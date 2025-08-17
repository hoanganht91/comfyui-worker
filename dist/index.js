"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const redis_1 = require("./config/redis");
const config_1 = require("./config");
const services_1 = require("./services");
const shared_1 = require("@ptnk/shared");
const redisConnection = (0, redis_1.createRedisConnection)();
const generationService = new services_1.GenerationService();
// Worker to process IMG_GENERATE queue
const generationWorker = new bullmq_1.Worker(shared_1.QUEUE_NAMES.IMG_GENERATE, async (job) => {
    const { job_id, params } = job.data;
    console.log(`Processing generation job: ${job_id}`);
    console.log(`Parameters:`, {
        prompt: params.prompt.substring(0, 100) + '...',
        steps: params.steps,
        batch_size: params.batch_size,
        width: params.width,
        height: params.height,
    });
    try {
        await generationService.processGeneration(job.data);
        console.log(`✅ Successfully completed generation job: ${job_id}`);
        return {
            success: true,
            job_id,
            message: 'Generation completed successfully',
        };
    }
    catch (error) {
        console.error(`❌ Failed to process generation job ${job_id}:`, error);
        throw error;
    }
}, {
    connection: redisConnection,
    concurrency: config_1.config.worker.concurrency,
});
// Worker event handlers
generationWorker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed successfully`);
});
generationWorker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
});
generationWorker.on('error', (err) => {
    console.error('Worker error:', err);
});
generationWorker.on('ready', () => {
    console.log('Worker is ready and waiting for jobs');
});
generationWorker.on('stalled', (jobId) => {
    console.warn(`Job ${jobId} stalled`);
});
// Graceful shutdown
const shutdown = async () => {
    console.log('Shutting down ComfyWorker...');
    try {
        await generationWorker.close();
        await generationService.close();
        await redisConnection.quit();
        console.log('ComfyWorker shut down successfully');
        process.exit(0);
    }
    catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    shutdown();
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown();
});
console.log(`🚀 ComfyWorker started`);
console.log(`📡 Listening for ${shared_1.QUEUE_NAMES.IMG_GENERATE} jobs...`);
console.log(`⚙️  Concurrency: ${config_1.config.worker.concurrency}`);
console.log(`🔗 ComfyUI URL: ${config_1.config.comfyui.baseUrl}`);
