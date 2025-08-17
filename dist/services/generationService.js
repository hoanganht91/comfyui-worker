"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerationService = void 0;
const comfyuiService_1 = require("./comfyuiService");
const queueService_1 = require("./queueService");
const config_1 = require("../config");
const shared_1 = require("@ptnk/shared");
class GenerationService {
    constructor() {
        this.comfyuiService = new comfyuiService_1.ComfyUIService();
        this.queueService = new queueService_1.QueueService();
    }
    // Process a generation job
    async processGeneration(jobData) {
        const { job_id, params, comfy_config } = jobData;
        console.log(`Starting generation for job ${job_id}`);
        try {
            // Send initial status update
            await this.sendStatusUpdate(job_id, shared_1.JobStatus.IN_PROGRESS, 0, 'Starting generation...');
            // Check if ComfyUI is available
            const isHealthy = await this.comfyuiService.healthCheck();
            if (!isHealthy) {
                throw new Error('ComfyUI is not available');
            }
            // Submit prompt to ComfyUI
            await this.sendStatusUpdate(job_id, shared_1.JobStatus.IN_PROGRESS, 10, 'Submitting prompt to ComfyUI...');
            const promptResponse = await this.comfyuiService.submitPrompt(comfy_config.workflow, params);
            const promptId = promptResponse.prompt_id;
            console.log(`Submitted prompt ${promptId} for job ${job_id}`);
            // Poll for completion
            await this.sendStatusUpdate(job_id, shared_1.JobStatus.IN_PROGRESS, 20, 'Waiting for generation to complete...');
            const result = await this.pollForCompletion(promptId, job_id);
            if (result.success) {
                await this.sendStatusUpdate(job_id, shared_1.JobStatus.FINISHED, 100, 'Generation completed successfully', result.images);
            }
            else {
                throw new Error(result.error || 'Generation failed');
            }
        }
        catch (error) {
            console.error(`Generation failed for job ${job_id}:`, error);
            await this.sendStatusUpdate(job_id, shared_1.JobStatus.FAILED, 0, 'Generation failed', undefined, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }
    // Poll ComfyUI for completion status
    async pollForCompletion(promptId, jobId) {
        let attempts = 0;
        const maxAttempts = 300; // 5 minutes with 1 second intervals
        while (attempts < maxAttempts) {
            try {
                // Get history for this prompt
                const history = await this.comfyuiService.getHistory(promptId);
                if (history[promptId]) {
                    const promptHistory = history[promptId];
                    // Check if completed
                    if (promptHistory.status.completed) {
                        if (promptHistory.status.status_str === 'success') {
                            // Extract images from outputs
                            const images = await this.extractImages(promptHistory.outputs);
                            return { success: true, images };
                        }
                        else {
                            // Generation failed
                            const errorMessages = promptHistory.status.messages.map(msg => msg.join(' ')).join('; ');
                            return { success: false, error: errorMessages || 'Generation failed' };
                        }
                    }
                }
                // Update progress based on queue position
                const progress = Math.min(20 + (attempts / maxAttempts) * 70, 90);
                await this.sendStatusUpdate(jobId, shared_1.JobStatus.IN_PROGRESS, Math.floor(progress), 'Generating...');
                // Wait before next poll
                await new Promise(resolve => setTimeout(resolve, config_1.config.worker.pollingInterval));
                attempts++;
            }
            catch (error) {
                console.error(`Error polling for completion (attempt ${attempts}):`, error);
                attempts++;
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, config_1.config.worker.pollingInterval));
            }
        }
        return { success: false, error: 'Generation timeout' };
    }
    // Extract images from ComfyUI outputs
    async extractImages(outputs) {
        const images = [];
        for (const nodeId in outputs) {
            const nodeOutput = outputs[nodeId];
            if (nodeOutput.images && Array.isArray(nodeOutput.images)) {
                for (const imageInfo of nodeOutput.images) {
                    try {
                        const imageData = await this.comfyuiService.getImage(imageInfo.filename, imageInfo.subfolder, imageInfo.type);
                        images.push(imageData);
                    }
                    catch (error) {
                        console.error('Error getting image:', error);
                    }
                }
            }
        }
        return images;
    }
    // Send status update to result queue
    async sendStatusUpdate(jobId, status, progress, message, result, error) {
        const resultData = {
            job_id: jobId,
            status,
            progress,
            message,
            result,
            error,
        };
        if (status === shared_1.JobStatus.FINISHED || status === shared_1.JobStatus.FAILED) {
            resultData.completed_at = new Date();
        }
        await this.queueService.sendResult(resultData);
    }
    // Close services
    async close() {
        await this.queueService.close();
    }
}
exports.GenerationService = GenerationService;
