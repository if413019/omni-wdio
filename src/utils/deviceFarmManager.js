/**
 * Device Farm Manager for integrating with Appium Device Farm
 * This allows using an external device farm service for test execution
 */
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DeviceFarmManager {
    constructor() {
        this.config = {
            baseUrl: process.env.DEVICE_FARM_URL || 'http://localhost:4723',
            apiKey: process.env.DEVICE_FARM_API_KEY,
            username: process.env.DEVICE_FARM_USERNAME,
            password: process.env.DEVICE_FARM_PASSWORD,
        };
        
        // Map to track device allocations
        this.allocations = new Map();
    }

    /**
     * Initialize connection to the device farm
     */
    async initialize() {
        try {
            // Test connection to the device farm
            const response = await this._makeRequest('GET', '/status');
            
            if (response.status === 200) {
                console.log('Successfully connected to Device Farm:', this.config.baseUrl);
                return true;
            }
        } catch (error) {
            console.error('Failed to connect to Device Farm:', error.message);
            return false;
        }
    }

    /**
     * Get available devices from the device farm
     * @param {string} platform - 'android' or 'ios'
     * @returns {Array} List of available devices
     */
    async getAvailableDevices(platform) {
        try {
            // Make request to device farm API to get available devices
            const endpoint = '/devices';
            const response = await this._makeRequest('GET', endpoint, {
                platformName: platform
            });
            
            if (response.status === 200 && response.data.devices) {
                const devices = response.data.devices.filter(device => !device.busy);
                console.log(`Found ${devices.length} available ${platform} devices`);
                return devices;
            }
            
            return [];
        } catch (error) {
            console.error(`Failed to get available ${platform} devices:`, error.message);
            return [];
        }
    }

    /**
     * Request a device from the device farm
     * @param {string} platform - 'android' or 'ios'
     * @param {Object} capabilities - WebdriverIO capabilities
     * @param {string} testId - Unique identifier for the test
     * @returns {Object} Device information and session details
     */
    async requestDevice(platform, capabilities, testId) {
        try {
            // Check if this test already has an allocated device
            if (this.allocations.has(testId)) {
                console.log(`Test ${testId} already has an allocated device`);
                return this.allocations.get(testId);
            }
            
            // Request device allocation from device farm
            const endpoint = '/device';
            const response = await this._makeRequest('POST', endpoint, {
                platformName: platform,
                capabilities,
                testId,
                reserveTimeout: 300 // Reserve device for 5 minutes (adjust as needed)
            });
            
            if (response.status === 200 && response.data.device) {
                const allocation = {
                    device: response.data.device,
                    sessionId: response.data.sessionId,
                    endpoint: response.data.endpoint,
                    allocated: true,
                    timestamp: new Date().toISOString()
                };
                
                // Store allocation
                this.allocations.set(testId, allocation);
                
                console.log(`Allocated device ${allocation.device.id} for test ${testId}`);
                return allocation;
            }
            
            throw new Error(`Failed to allocate device: ${response.data.message || 'Unknown error'}`);
        } catch (error) {
            console.error(`Failed to request ${platform} device:`, error.message);
            return null;
        }
    }

    /**
     * Release a device back to the device farm
     * @param {string} testId - Unique identifier for the test
     * @returns {boolean} True if device was successfully released
     */
    async releaseDevice(testId) {
        try {
            // Check if this test has an allocated device
            if (!this.allocations.has(testId)) {
                console.log(`No device allocation found for test ${testId}`);
                return true;
            }
            
            const allocation = this.allocations.get(testId);
            
            // Release device allocation from device farm
            const endpoint = `/device/${allocation.device.id}/release`;
            const response = await this._makeRequest('POST', endpoint, {
                sessionId: allocation.sessionId,
                testId
            });
            
            if (response.status === 200) {
                // Remove allocation
                this.allocations.delete(testId);
                
                console.log(`Released device ${allocation.device.id} for test ${testId}`);
                return true;
            }
            
            throw new Error(`Failed to release device: ${response.data.message || 'Unknown error'}`);
        } catch (error) {
            console.error(`Failed to release device for test ${testId}:`, error.message);
            return false;
        }
    }

    /**
     * Get remote WebdriverIO options for connecting to a device
     * @param {string} testId - Unique identifier for the test
     * @returns {Object} WebdriverIO remote options
     */
    getRemoteOptions(testId) {
        if (!this.allocations.has(testId)) {
            throw new Error(`No device allocation found for test ${testId}`);
        }
        
        const allocation = this.allocations.get(testId);
        
        // Extract connection details from the allocation
        const [protocol, hostname] = allocation.endpoint.split('://');
        const [host, port] = hostname.split(':');
        
        return {
            protocol: protocol || 'http',
            hostname: host || 'localhost',
            port: parseInt(port || '4723'),
            path: '/wd/hub',
            capabilities: {
                ...allocation.device.capabilities,
                'appium:sessionId': allocation.sessionId
            }
        };
    }

    /**
     * Make a request to the device farm API
     * @private
     * @param {string} method - HTTP method
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request data
     * @returns {Object} API response
     */
    async _makeRequest(method, endpoint, data = {}) {
        const url = `${this.config.baseUrl}${endpoint}`;
        const headers = {};
        
        // Add authentication if available
        if (this.config.apiKey) {
            headers['X-API-Key'] = this.config.apiKey;
        } else if (this.config.username && this.config.password) {
            const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
            headers['Authorization'] = `Basic ${auth}`;
        }
        
        return axios({
            method,
            url,
            headers,
            data: method !== 'GET' ? data : undefined,
            params: method === 'GET' ? data : undefined
        });
    }
}

// Create singleton instance
const deviceFarmManager = new DeviceFarmManager();
export default deviceFarmManager;