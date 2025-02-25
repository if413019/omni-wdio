import { config as baseConfig } from './wdio.conf.js';
import { config as appConfig } from '../src/utils/config.js';
import deviceFarmManager from '../src/utils/deviceFarmManager.js';
import testDataManager from '../src/utils/testDataManager.js';
import ParallelReporter from '../src/utils/parallelReporter.js';
import path from 'path';
import fs from 'fs';

// Ensure directories exist
const screenshotsDir = path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Create a global store for sharing test contexts between WebdriverIO and our framework
if (!global.testContext) {
    global.testContext = {};
}

// Initialize Device Farm connection
(async () => {
    await deviceFarmManager.initialize();
})();

// Configuration for Device Farm execution
export const config = {
    ...baseConfig,
    
    // Maximum parallel instances to run
    maxInstances: process.env.MAX_INSTANCES ? parseInt(process.env.MAX_INSTANCES) : 10,
    
    // Use Appium Grid to handle the sessions
    hostname: process.env.DEVICE_FARM_URL || 'localhost',
    port: process.env.DEVICE_FARM_PORT || 4723,
    path: '/wd/hub',
    
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
        
        console.log(`[Device Farm] Initializing test "${testName}" with ID: ${testId}`);
    },
    
    // Request a device from the device farm before each test
    beforeTest: async function (test, context) {
        // Get platform from environment or use Android as default
        const platform = process.env.PLATFORM === 'ios' ? 'ios' : 'android';
        
        // Get base capabilities from config
        const baseCapabilities = appConfig.getPlatformConfig(platform);
        
        // Add test-specific identifiers to capabilities
        const capabilities = {
            ...baseCapabilities,
            'appium:testId': context.testId,
            'appium:testName': test.title
        };
        
        // Request a device from the device farm
        const allocation = await deviceFarmManager.requestDevice(
            platform, 
            capabilities, 
            context.testId
        );
        
        if (!allocation) {
            throw new Error(`No available ${platform} devices for test: ${context.testId}`);
        }
        
        // Store device information in test context
        context.deviceAllocation = allocation;
        
        // Initialize isolated test data
        const baseTestData = {
            platform,
            device: allocation.device,
            user: testDataManager.loadTestData('users')[0] // Load a test user
        };
        
        // Initialize isolated test data and attach to test context
        const testData = testDataManager.initializeTestData(context.testId, baseTestData);
        context.testData = testData;
        
        // Store in global context to share with our BaseTest
        if (global.testContext[context.testId]) {
            global.testContext[context.testId].testData = testData;
            global.testContext[context.testId].deviceAllocation = allocation;
        }
        
        console.log(`[Device Farm] Test "${test.title}" running on device: ${allocation.device.name || allocation.device.id} with testId: ${context.testId}`);
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
                console.log(`[Device Farm] Test failed. Screenshot saved to: ${screenshotPath}`);
            } catch (err) {
                console.error(`[Device Farm] Failed to capture screenshot: ${err.message}`);
            }
        }
        
        // Release allocated device
        if (context.deviceAllocation) {
            await deviceFarmManager.releaseDevice(testId);
        }
        
        // Clean up test data
        testDataManager.cleanupTestData(testId);
        
        // Clean up global context
        if (global.testContext[testId]) {
            delete global.testContext[testId];
        }
        
        console.log(`[Device Farm] Test "${test.title}" completed. Device released.`);
    },
    
    // Ensure all devices are released after all tests
    after: async function (result, capabilities, specs) {
        // Release any remaining devices
        for (const [testId, context] of Object.entries(global.testContext)) {
            if (context.deviceAllocation) {
                try {
                    await deviceFarmManager.releaseDevice(testId);
                    console.log(`[Device Farm] Released device for orphaned test: ${testId}`);
                } catch (err) {
                    console.error(`[Device Farm] Failed to release device for test: ${testId}`, err);
                }
            }
        }
        
        // Clear global test context
        global.testContext = {};
    }
};