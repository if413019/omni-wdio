import { driver } from '@wdio/globals';
import { pageRegistry } from './PageRegistry.js';
import { getRemoteOptions } from '../utils/remoteOptions.js';
import { remote } from 'webdriverio';
import deviceManager from '../utils/deviceManager.js';
import testDataManager from '../utils/testDataManager.js';

export class BaseTest {
    constructor(appName) {
        this.driver = driver;
        this._apps = new Map();
        this.appName = appName;
        this.testId = null;
        this.testData = null;
        this.isParallelExecution = process.env.PARALLEL === 'true';
        this.initializeApp(appName);
    }

    /**
     * Initialize an app's pages as properties
     * @param {string} appName - Name of the app (e.g., 'sample_app')
     * @private
     */
    initializeApp(appName) {
        // Create a proxy object for the app that will lazily get page instances
        const appProxy = new Proxy({}, {
            get: (target, pageName) => {
                if (typeof pageName === 'string') {
                    return pageRegistry.get(appName, pageName);
                }
                return undefined;
            }
        });

        // Add the app proxy as a property of the test instance
        Object.defineProperty(this, appName, {
            get: () => appProxy,
            configurable: true,
            enumerable: true
        });

        this._apps.set(appName, appProxy);
    }

    /**
     * Generate a unique test ID
     * @param {string} testName - Name of the test
     * @returns {string} Unique test ID
     */
    generateTestId(testName) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `${this.appName}_${testName.replace(/\s+/g, '_')}_${timestamp}_${random}`;
    }

    /**
     * Setup before running any test
     * @param {string} testName - Name of the test being executed
     */
    async before(testName = 'unknown') {
        try {
            // Generate unique test ID
            this.testId = this.generateTestId(testName);
            
            const platform = process.env.PLATFORM || 'android';
            
            if (this.isParallelExecution) {
                // In parallel mode, device allocation is handled by the WebdriverIO hooks
                // Wait for the driver to be initialized by WebdriverIO
                this.driver = driver;
                
                // Get test data from WebdriverIO context
                if (global.testContext && global.testContext[this.testId]) {
                    this.testData = global.testContext[this.testId].testData;
                } else {
                    // Initialize test data if not already done
                    this.testData = testDataManager.initializeTestData(this.testId, {
                        platform,
                        appName: this.appName
                    });
                }
            } else {
                // In sequential mode, handle device allocation manually
                const remoteOptions = getRemoteOptions(platform);
                
                // Initialize WebdriverIO with remote options
                this.driver = await remote(remoteOptions);
                
                // Initialize test data
                this.testData = testDataManager.initializeTestData(this.testId, {
                    platform,
                    appName: this.appName
                });
            }
            
            // Make driver globally available
            global.driver = this.driver;
            
            console.log(`Test "${testName}" initialized with ID: ${this.testId}`);
            
        } catch (error) {
            console.error(`Failed to initialize driver for test "${testName}":`, error);
            throw error;
        }
    }

    /**
     * Setup before each test
     */
    async beforeEach() {
        // Reset page instances to ensure clean state
        pageRegistry.reset();
        
        if (!this.isParallelExecution) {
            // Only reload session in sequential mode
            // In parallel mode, each test gets a fresh session
            await this.driver.reloadSession();
        }
        
        console.log(`Running test with data:`, this.testData);
    }

    /**
     * Cleanup after each test
     */
    async afterEach() {
        // Cleanup after test execution
        // Take screenshots on failure if needed
        if (this.driver && this.driver.takeScreenshot) {
            try {
                const screenshot = await this.driver.takeScreenshot();
                // Save screenshot or attach to report
                console.log(`Screenshot taken for test: ${this.testId}`);
            } catch (error) {
                console.warn(`Failed to take screenshot for test: ${this.testId}`, error);
            }
        }
    }

    /**
     * Cleanup after all tests
     */
    async after() {
        if (!this.isParallelExecution) {
            // In sequential mode, clean up resources manually
            // In parallel mode, cleanup is handled by WebdriverIO hooks
            
            // Release device if allocated
            if (this.testId) {
                deviceManager.releaseDevice(this.testId);
            }
            
            // Clean up test data
            if (this.testId) {
                testDataManager.cleanupTestData(this.testId);
            }
        }
        
        console.log(`Test completed with ID: ${this.testId}`);
    }
    
    /**
     * Get the test data for the current test
     * @returns {Object} Test data
     */
    getTestData() {
        return this.testData || {};
    }
    
    /**
     * Update test data for the current test
     * @param {Object} newData - New data to merge with existing test data
     * @returns {Object} Updated test data
     */
    updateTestData(newData) {
        if (!this.testId) {
            console.warn('Cannot update test data: No test ID');
            return this.testData || {};
        }
        
        this.testData = testDataManager.updateTestData(this.testId, newData);
        return this.testData;
    }
}
