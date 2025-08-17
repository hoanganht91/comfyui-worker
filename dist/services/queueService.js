"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
const shared_1 = require("@ptnk/shared");
class QueueService {
    constructor() {
        this.redisConnection = (0, redis_1.createRedisConnection)();
        // Queue for sending results back to BackofficeWorker
        this.resultQueue = new bullmq_1.Queue(shared_1.QUEUE_NAMES.IMG_GENERATE_RESULT, {
            connection: this.redisConnection,
            defaultJobOptions: {
                removeOnComplete: 50,
                removeOnFail: 20,
            },
        });
    }
    // Send generation result update
    async sendResult(result) {
        try {
            await this.resultQueue.add('update-result', result, {
                jobId: `${result.job_id}-${Date.now()}`,
            });
            console.log(`Sent result update for job ${result.job_id}: ${result.status} (${result.progress}%)`);
        }
        catch (error) {
            console.error(`Error sending result for job ${result.job_id}:`, error);
            throw error;
        }
    }
    // Close connections
    async close() {
        await this.resultQueue.close();
        await this.redisConnection.quit();
    }
}
exports.QueueService = QueueService;
