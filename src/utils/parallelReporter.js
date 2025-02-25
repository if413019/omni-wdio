/**
 * Parallel Execution Reporter Plugin
 * Provides enhanced reporting for parallel test execution
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ParallelReporter {
    constructor(options = {}) {
        this.options = {
            outputDir: path.resolve(process.cwd(), 'reports', 'parallel-execution'),
            ...options
        };
        
        this.tests = new Map();
        this.deviceAssignments = new Map();
        this.startTime = Date.now();
        this.executionId = `exec_${this.startTime}`;
        this.ensureReportDirectory();
    }
    
    ensureReportDirectory() {
        if (!fs.existsSync(this.options.outputDir)) {
            fs.mkdirSync(this.options.outputDir, { recursive: true });
        }
    }
    
    /**
     * Called when test execution starts
     */
    onRunnerStart(runner) {
        const runnerInfo = {
            cid: runner.cid,
            capabilities: runner.capabilities,
            specs: runner.specs,
            startTime: Date.now(),
            status: 'running'
        };
        
        this.tests.set(runner.cid, {
            ...runnerInfo,
            results: []
        });
        
        this.saveExecutionStatus();
        
        console.log(`[Parallel Reporter] Test runner ${runner.cid} started on ${runner.capabilities.deviceName || 'unknown device'}`);
    }
    
    /**
     * Called when a test starts
     */
    onTestStart(test) {
        const cid = test.cid;
        const testInfo = this.tests.get(cid);
        
        if (testInfo) {
            // Record device assignment for this test
            this.deviceAssignments.set(test.title, {
                cid,
                device: testInfo.capabilities.deviceName || 'unknown',
                startTime: Date.now()
            });
            
            // Update test info
            testInfo.results.push({
                test: test.title,
                status: 'running',
                startTime: Date.now()
            });
            
            this.tests.set(cid, testInfo);
            this.saveExecutionStatus();
            
            console.log(`[Parallel Reporter] Test "${test.title}" started on ${testInfo.capabilities.deviceName || 'unknown device'}`);
        }
    }
    
    /**
     * Called when a test ends
     */
    onTestEnd(test) {
        const cid = test.cid;
        const testInfo = this.tests.get(cid);
        
        if (testInfo) {
            // Find the test in results
            const testResult = testInfo.results.find(t => t.test === test.title);
            
            if (testResult) {
                testResult.status = test.passed ? 'passed' : 'failed';
                testResult.endTime = Date.now();
                testResult.duration = testResult.endTime - testResult.startTime;
                
                if (!test.passed) {
                    testResult.error = test.error?.message || 'Unknown error';
                }
            }
            
            this.tests.set(cid, testInfo);
            this.saveExecutionStatus();
            
            console.log(`[Parallel Reporter] Test "${test.title}" ${test.passed ? 'passed' : 'failed'} on ${testInfo.capabilities.deviceName || 'unknown device'}`);
        }
    }
    
    /**
     * Called when runner ends
     */
    onRunnerEnd(runner) {
        const testInfo = this.tests.get(runner.cid);
        
        if (testInfo) {
            testInfo.status = 'completed';
            testInfo.endTime = Date.now();
            testInfo.duration = testInfo.endTime - testInfo.startTime;
            
            this.tests.set(runner.cid, testInfo);
            this.saveExecutionStatus();
            
            console.log(`[Parallel Reporter] Test runner ${runner.cid} completed on ${runner.capabilities.deviceName || 'unknown device'}`);
        }
    }
    
    /**
     * Save current execution status to file
     */
    saveExecutionStatus() {
        const executionData = {
            id: this.executionId,
            startTime: this.startTime,
            currentTime: Date.now(),
            runners: Array.from(this.tests.entries()).map(([cid, info]) => ({
                cid,
                capabilities: info.capabilities,
                specs: info.specs,
                status: info.status,
                startTime: info.startTime,
                endTime: info.endTime,
                duration: info.duration,
                results: info.results
            })),
            deviceAssignments: Array.from(this.deviceAssignments.entries()).map(([test, info]) => ({
                test,
                cid: info.cid,
                device: info.device,
                startTime: info.startTime
            }))
        };
        
        const outputFile = path.join(this.options.outputDir, `${this.executionId}.json`);
        fs.writeFileSync(outputFile, JSON.stringify(executionData, null, 2));
        
        // Also write a summary file for quick reference
        this.saveSummary();
    }
    
    /**
     * Save execution summary to file
     */
    saveSummary() {
        const summary = {
            id: this.executionId,
            startTime: new Date(this.startTime).toISOString(),
            duration: (Date.now() - this.startTime) / 1000,
            runners: this.tests.size,
            devices: new Set(Array.from(this.tests.values()).map(info => info.capabilities.deviceName)).size,
            tests: {
                total: Array.from(this.tests.values()).reduce((count, info) => count + info.results.length, 0),
                passed: Array.from(this.tests.values()).reduce((count, info) => 
                    count + info.results.filter(t => t.status === 'passed').length, 0),
                failed: Array.from(this.tests.values()).reduce((count, info) => 
                    count + info.results.filter(t => t.status === 'failed').length, 0),
                running: Array.from(this.tests.values()).reduce((count, info) => 
                    count + info.results.filter(t => t.status === 'running').length, 0)
            }
        };
        
        const outputFile = path.join(this.options.outputDir, `${this.executionId}_summary.json`);
        fs.writeFileSync(outputFile, JSON.stringify(summary, null, 2));
    }
}

// Export class so it can be used by WebdriverIO
export default ParallelReporter;