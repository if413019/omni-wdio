/**
 * Test Data Manager for handling isolated test data during parallel execution
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to test data directory
const TEST_DATA_DIR = path.resolve(__dirname, '../testData');

class TestDataManager {
    constructor() {
        this.testData = new Map();
        this.testExecutionContexts = new Map();
        this.dataCache = new Map();
    }

    /**
     * Initialize test data for a specific test run
     * @param {string} testId - Unique identifier for the test
     * @param {Object} baseData - Base test data to use
     * @returns {Object} Isolated test data for this test
     */
    initializeTestData(testId, baseData = {}) {
        // Generate a unique execution context ID
        const executionContext = {
            id: `exec-${Date.now()}-${Math.round(Math.random() * 10000)}`,
            startTime: new Date(),
            testId
        };
        
        // Store the execution context
        this.testExecutionContexts.set(testId, executionContext);
        
        // Clone and isolate test data
        const isolatedData = this._isolateData(baseData, executionContext.id);
        
        // Store isolated data
        this.testData.set(testId, isolatedData);
        
        return isolatedData;
    }

    /**
     * Get test data for a specific test
     * @param {string} testId - Unique identifier for the test
     * @returns {Object} Test data for this test
     */
    getTestData(testId) {
        return this.testData.get(testId) || {};
    }

    /**
     * Update test data for a specific test
     * @param {string} testId - Unique identifier for the test
     * @param {Object} newData - New data to merge with existing data
     * @returns {Object} Updated test data
     */
    updateTestData(testId, newData) {
        const currentData = this.getTestData(testId);
        const updatedData = { ...currentData, ...newData };
        this.testData.set(testId, updatedData);
        return updatedData;
    }

    /**
     * Clean up test data after test completion
     * @param {string} testId - Unique identifier for the test
     */
    cleanupTestData(testId) {
        this.testData.delete(testId);
        this.testExecutionContexts.delete(testId);
    }

    /**
     * Isolate data by adding unique identifiers
     * @param {Object} data - Base data to isolate
     * @param {string} contextId - Execution context ID
     * @returns {Object} Isolated data
     * @private
     */
    _isolateData(data, contextId) {
        const isolatedData = { ...data };
        
        // Handle different data types based on the app's requirements
        // For example, adding suffixes to user emails, IDs, etc.
        
        // Example: If there are user credentials, make them unique
        if (isolatedData.user) {
            if (isolatedData.user.email) {
                // Transform email like 'user@example.com' to 'user+exec123@example.com'
                const [name, domain] = isolatedData.user.email.split('@');
                isolatedData.user.email = `${name}+${contextId}@${domain}`;
            }
            
            if (isolatedData.user.username) {
                isolatedData.user.username = `${isolatedData.user.username}_${contextId}`;
            }
        }
        
        // Add execution context to isolated data for tracking
        isolatedData._executionContext = contextId;
        
        return isolatedData;
    }

    /**
     * Create a unique test ID
     * @param {string} specFile - Spec file path
     * @param {string} testName - Test name
     * @returns {string} Unique test ID
     */
    static createTestId(specFile, testName) {
        const specFileName = specFile.split('/').pop().replace(/\..+$/, '');
        return `${specFileName}_${testName.replace(/\s+/g, '_')}`;
    }
    
    /**
     * Load test data from a file for a specific test type
     * @param {string} dataType - Type of test data to load (e.g., 'users', 'products')
     * @param {string} [category] - Specific category of data to load (e.g., 'valid', 'admin')
     * @param {number} [index] - Specific index to retrieve (default is 0)
     * @returns {Object|Array} Loaded test data
     */
    loadTestData(dataType, category = null, index = 0) {
        try {
            // Check if data is already cached
            const cacheKey = `${dataType}:${category || 'all'}`;
            
            if (!this.dataCache.has(cacheKey)) {
                // Load from file
                const dataFilePath = path.join(TEST_DATA_DIR, `${dataType}.json`);
                
                if (!fs.existsSync(dataFilePath)) {
                    console.warn(`Test data file not found: ${dataFilePath}`);
                    return category ? {} : [];
                }
                
                const fileData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
                
                // Cache the data
                this.dataCache.set(cacheKey, fileData[dataType] || {});
            }
            
            const data = this.dataCache.get(cacheKey);
            
            // Return specific category if requested
            if (category) {
                const categoryData = data[category] || [];
                // Return specific item or first item
                return categoryData.length > index ? categoryData[index] : (categoryData[0] || {});
            }
            
            // Return all data if no category specified
            return data;
        } catch (error) {
            console.error(`Failed to load test data for ${dataType}:`, error);
            return category ? {} : [];
        }
    }
    
    /**
     * Get a user by type
     * @param {string} type - Type of user (e.g., 'valid', 'invalid', 'admin')
     * @param {number} [index] - Index of user to retrieve (default is 0)
     * @returns {Object} User data
     */
    getUser(type = 'valid', index = 0) {
        return this.loadTestData('users', type, index);
    }
    
    /**
     * Get a product by type
     * @param {string} type - Type of product (e.g., 'standard', 'featured')
     * @param {number} [index] - Index of product to retrieve (default is 0)
     * @returns {Object} Product data
     */
    getProduct(type = 'standard', index = 0) {
        return this.loadTestData('products', type, index);
    }
}

// Create singleton instance
const testDataManager = new TestDataManager();
export default testDataManager;