import { config as baseConfig } from './wdio.conf.js';
import { config as appConfig } from '../src/utils/config.js';
import deviceManager from '../src/utils/deviceManager.js';
import testDataManager from '../src/utils/testDataManager.js';
import ParallelReporter from '../src/utils/parallelReporter.js';
import path from 'path';
import fs from 'fs';

// Ensure directories exist
const screenshotsDir = path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Load device configurations for parallel execution
const androidDevices = [
    {
        id: 'emulator-5554',
        deviceName: 'Pixel_5_API_31',
        platformVersion: '12.0',
        // Include other Android-specific capabilities
    },
    {
        id: 'emulator-5556',
        deviceName: 'Pixel_4_API_30',
        platformVersion: '11.0',
        // Include other Android-specific capabilities
    }
    // Add more devices as needed
];

const iosDevices = [
    {
        udid: 'A4951C44-F23F-4E94-8435-05AA4BA2A87F',
        deviceName: 'iPhone 13',
        platformVersion: '15.0',
        // Include other iOS-specific capabilities
    },
    {
        udid: 'B2345C67-D89F-4E56-8123-06BB3BA1A65D',
        deviceName: 'iPhone 12',
        platformVersion: '14.5',
        // Include other iOS-specific capabilities
    }
    // Add more devices as needed
];

// Initialize device pool
deviceManager.initializeDevicePool(androidDevices, iosDevices);

// Create a global store for sharing test contexts between WebdriverIO and our framework
if (!global.testContext) {
    global.testContext = {};
}

// Configuration for parallel execution
export const config = {
    ...baseConfig,
    
    // Maximum parallel instances to run
    maxInstances: process.env.MAX_INSTANCES ? parseInt(process.env.MAX_INSTANCES) : 4,
    
    // Dynamic capabilities - will be set per test
    capabilities: [],
    
    // Set a unique spec file for each capability
    // This makes WebdriverIO run one test file per instance
    specFileRetries: 0,
    
    // Add our custom parallel reporter
    reporters: [
        'spec',
        ['allure', {
            outputDir: 'allure-results',
            disableWebdriverStepsReporting: true,
            disableWebdriverScreenshotsReporting: false,
        }],
        [ParallelReporter, {
            outputDir: path.join(process.cwd(), 'reports', 'parallel-execution')
        }]
    ],
    
    // Distribute tests to available devices
    beforeHook: async function (test, context) {
        // Create a unique test ID
        const specFile = context.currentTest.file;
        const testName = context.currentTest.title;
        const testId = testDataManager.createTestId(specFile, testName);
        
        // Store test ID in the test context for later use
        context.testId = testId;
        
        // Store in global context to share with our BaseTest
        global.testContext[testId] = { 
            testId,
            testName,
            specFile
        };
        
        console.log(`[Parallel] Initializing test "${testName}" with ID: ${testId}`);
    },
    
    // Allocate a device and initialize test data before each test
    beforeTest: async function (test, context) {
        // Get platform from environment or use Android as default
        const platform = process.env.PLATFORM === 'ios' ? 'ios' : 'android';
        
        // Allocate a device from the pool
        const device = deviceManager.allocateDevice(platform, context.testId);
        
        if (!device) {
            throw new Error(`No available ${platform} devices for test: ${context.testId}`);
        }
        
        // Set dynamic capabilities for this test
        const platformConfig = appConfig.getPlatformConfig(platform);
        
        // Merge platform config with allocated device info
        const capabilities = {
            ...platformConfig,
            // Override with specific device properties
            'appium:deviceName': device.deviceName,
            ...(platform === 'android' ? { 'appium:udid': device.id } : { 'appium:udid': device.udid }),
            ...(platform === 'ios' ? { 'appium:platformVersion': device.platformVersion } : {})
        };
        
        // Set capabilities for this session
        this.capabilities = capabilities;
        
        // Initialize isolated test data
        const baseTestData = {
            platform,
            device: device,
            user: testDataManager.loadTestData('users')[0] // Load a test user
        };
        
        // Initialize isolated test data and attach to test context
        const testData = testDataManager.initializeTestData(context.testId, baseTestData);
        context.testData = testData;
        
        // Store in global context to share with our BaseTest
        if (global.testContext[context.testId]) {
            global.testContext[context.testId].testData = testData;
            global.testContext[context.testId].device = device;
        }
        
        console.log(`[Parallel] Test "${test.title}" running on device: ${device.deviceName} with testId: ${context.testId}`);
    },
    
    // Release device and clean up test data after test completion
    afterTest: async function (test, context, { error, result, duration, passed, retries }) {
        const testId = context.testId;
        
        // Save screenshot on failure
        if (!passed) {
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            const screenshotPath = path.join(screenshotsDir, `${testId}_${timestamp}.png`);
            
            try {
                await browser.saveScreenshot(screenshotPath);
                console.log(`[Parallel] Test failed. Screenshot saved to: ${screenshotPath}`);
            } catch (err) {
                console.error(`[Parallel] Failed to capture screenshot: ${err.message}`);
            }
        }
        
        // Release allocated device
        deviceManager.releaseDevice(testId);
        
        // Clean up test data
        testDataManager.cleanupTestData(testId);
        
        // Clean up global context
        if (global.testContext[testId]) {
            delete global.testContext[testId];
        }
        
        console.log(`[Parallel] Test "${test.title}" completed. Device released.`);
    },
    
    // Ensure all devices are released after all tests
    after: async function (result, capabilities, specs) {
        // Clean up any remaining device locks just in case
        const lockFile = path.resolve(process.cwd(), 'device-locks.json');
        if (fs.existsSync(lockFile)) {
            try {
                fs.unlinkSync(lockFile);
                console.log('[Parallel] Removed device lock file');
            } catch (err) {
                console.error('[Parallel] Failed to remove device lock file:', err);
            }
        }
    }
};