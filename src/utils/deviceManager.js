/**
 * Device Manager for handling dynamic device allocation during parallel test execution
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DeviceManager {
    constructor() {
        this.devices = {
            android: [],
            ios: []
        };
        this.locks = new Map();
        this.lockFilePath = path.resolve(process.cwd(), 'device-locks.json');
    }

    /**
     * Initialize device pool from device configurations
     * @param {Object} androidDevices - List of Android devices
     * @param {Object} iosDevices - List of iOS devices
     */
    initializeDevicePool(androidDevices = [], iosDevices = []) {
        this.devices.android = androidDevices.map(device => ({
            ...device,
            inUse: false
        }));
        
        this.devices.ios = iosDevices.map(device => ({
            ...device,
            inUse: false
        }));

        // Try to restore locks from disk (useful for distributed execution)
        this._restoreLocks();
    }

    /**
     * Allocate an available device for a test
     * @param {string} platform - 'android' or 'ios'
     * @param {string} testId - Unique identifier for the test
     * @returns {Object|null} Device configuration or null if no device is available
     */
    allocateDevice(platform, testId) {
        const availableDevices = this.devices[platform].filter(device => !device.inUse);
        
        if (availableDevices.length === 0) {
            console.warn(`No available ${platform} devices for test: ${testId}`);
            return null;
        }

        // Allocate the first available device
        const device = availableDevices[0];
        device.inUse = true;
        
        // Record the lock
        this.locks.set(testId, {
            platform,
            deviceId: device.id || device.udid,
            timestamp: new Date().toISOString()
        });
        
        // Persist the lock information
        this._persistLocks();
        
        return device;
    }

    /**
     * Release a device after test completion
     * @param {string} testId - Unique identifier for the test
     */
    releaseDevice(testId) {
        const lock = this.locks.get(testId);
        if (!lock) {
            console.warn(`No device lock found for test: ${testId}`);
            return;
        }

        const { platform, deviceId } = lock;
        const device = this.devices[platform].find(d => 
            (d.id === deviceId) || (d.udid === deviceId)
        );

        if (device) {
            device.inUse = false;
            this.locks.delete(testId);
            this._persistLocks();
        }
    }

    /**
     * Persist locks to disk for cross-process coordination
     * @private
     */
    _persistLocks() {
        try {
            const lockData = Array.from(this.locks.entries())
                .reduce((obj, [key, value]) => {
                    obj[key] = value;
                    return obj;
                }, {});
            
            fs.writeFileSync(this.lockFilePath, JSON.stringify(lockData, null, 2));
        } catch (error) {
            console.error('Failed to persist device locks:', error);
        }
    }

    /**
     * Restore locks from disk
     * @private
     */
    _restoreLocks() {
        try {
            if (fs.existsSync(this.lockFilePath)) {
                const lockData = JSON.parse(fs.readFileSync(this.lockFilePath, 'utf8'));
                
                // Clear existing locks
                this.locks.clear();
                
                // Restore locks from file
                Object.entries(lockData).forEach(([testId, lock]) => {
                    this.locks.set(testId, lock);
                    
                    // Mark corresponding device as in use
                    const { platform, deviceId } = lock;
                    const device = this.devices[platform].find(d => 
                        (d.id === deviceId) || (d.udid === deviceId)
                    );
                    
                    if (device) {
                        device.inUse = true;
                    }
                });
            }
        } catch (error) {
            console.error('Failed to restore device locks:', error);
        }
    }

    /**
     * Get all available devices
     * @returns {Object} Available devices by platform
     */
    getAvailableDevices() {
        return {
            android: this.devices.android.filter(device => !device.inUse),
            ios: this.devices.ios.filter(device => !device.inUse)
        };
    }
}

// Create singleton instance
const deviceManager = new DeviceManager();
export default deviceManager;