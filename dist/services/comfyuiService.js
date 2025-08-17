"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComfyUIService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
class ComfyUIService {
    constructor() {
        this.client = axios_1.default.create({
            baseURL: config_1.config.comfyui.baseUrl,
            timeout: config_1.config.comfyui.timeout,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    // Apply generation parameters to ComfyUI workflow
    applyParametersToWorkflow(workflow, params) {
        // Deep clone the workflow to avoid modifying the original
        const modifiedWorkflow = JSON.parse(JSON.stringify(workflow));
        // This is a generic parameter mapping - you'll need to customize this based on your specific ComfyUI workflow structure
        // Common node types and their parameter mappings:
        for (const nodeId in modifiedWorkflow) {
            const node = modifiedWorkflow[nodeId];
            // Text prompt nodes (CLIPTextEncode)
            if (node.class_type === 'CLIPTextEncode') {
                if (node.inputs && typeof node.inputs.text === 'string') {
                    // Assume first text node is positive prompt, second is negative
                    if (node.inputs.text.toLowerCase().includes('positive') || !node.inputs.text.toLowerCase().includes('negative')) {
                        node.inputs.text = params.prompt;
                    }
                    else {
                        node.inputs.text = params.negative_prompt || '';
                    }
                }
            }
            // KSampler nodes
            if (node.class_type === 'KSampler' || node.class_type === 'KSamplerAdvanced') {
                if (node.inputs) {
                    if (params.seed !== undefined && params.seed !== -1) {
                        node.inputs.seed = params.seed;
                    }
                    if (params.steps !== undefined) {
                        node.inputs.steps = params.steps;
                    }
                    if (params.cfg_scale !== undefined) {
                        node.inputs.cfg = params.cfg_scale;
                    }
                    if (params.sampler_name !== undefined) {
                        node.inputs.sampler_name = params.sampler_name;
                    }
                    if (params.scheduler !== undefined) {
                        node.inputs.scheduler = params.scheduler;
                    }
                }
            }
            // Empty Latent Image nodes (for image dimensions)
            if (node.class_type === 'EmptyLatentImage') {
                if (node.inputs) {
                    if (params.width !== undefined) {
                        node.inputs.width = params.width;
                    }
                    if (params.height !== undefined) {
                        node.inputs.height = params.height;
                    }
                    if (params.batch_size !== undefined) {
                        node.inputs.batch_size = params.batch_size;
                    }
                }
            }
        }
        return modifiedWorkflow;
    }
    // Submit a prompt to ComfyUI
    async submitPrompt(workflow, params) {
        try {
            const modifiedWorkflow = this.applyParametersToWorkflow(workflow, params);
            const response = await this.client.post('/prompt', {
                prompt: modifiedWorkflow,
                client_id: `comfy-worker-${Date.now()}`,
            });
            return response.data;
        }
        catch (error) {
            console.error('Error submitting prompt to ComfyUI:', error);
            throw new Error(`Failed to submit prompt: ${error}`);
        }
    }
    // Get prompt history
    async getHistory(promptId) {
        try {
            const url = promptId ? `/history/${promptId}` : '/history';
            const response = await this.client.get(url);
            return response.data;
        }
        catch (error) {
            console.error('Error getting history from ComfyUI:', error);
            throw new Error(`Failed to get history: ${error}`);
        }
    }
    // Get queue status
    async getQueue() {
        try {
            const response = await this.client.get('/queue');
            return response.data;
        }
        catch (error) {
            console.error('Error getting queue from ComfyUI:', error);
            throw new Error(`Failed to get queue: ${error}`);
        }
    }
    // Get image data (base64)
    async getImage(filename, subfolder, type) {
        try {
            const params = new URLSearchParams();
            params.append('filename', filename);
            if (subfolder)
                params.append('subfolder', subfolder);
            if (type)
                params.append('type', type);
            const response = await this.client.get(`/view?${params.toString()}`, {
                responseType: 'arraybuffer',
            });
            // Convert to base64
            const base64 = Buffer.from(response.data).toString('base64');
            const mimeType = response.headers['content-type'] || 'image/png';
            return `data:${mimeType};base64,${base64}`;
        }
        catch (error) {
            console.error('Error getting image from ComfyUI:', error);
            throw new Error(`Failed to get image: ${error}`);
        }
    }
    // Check if ComfyUI is available
    async healthCheck() {
        try {
            await this.client.get('/system_stats');
            return true;
        }
        catch (error) {
            console.error('ComfyUI health check failed:', error);
            return false;
        }
    }
}
exports.ComfyUIService = ComfyUIService;
