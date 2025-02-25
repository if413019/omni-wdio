import { config as appConfig } from '../src/utils/config.js';

export const config = {
    // ==================================
    // Where should your test be launched
    // ==================================
    //
    runner: 'local',
    // =====================
    // Server Configurations
    // =====================
    //
    hostname: 'localhost',
    port: 4444,
    path: '/',
    // Specify Test Files
    // ==================
    // Define which test specs should run. The pattern is relative to the directory
    // of the configuration file being run.
    //
    specs: [
        `${process.cwd()}/src/apps/${process.env.APP_NAME}/tests/**/*.test.js`,
    ],
    // Patterns to exclude.
    exclude: [],

    maxInstances: 1,
    // ============
    // Capabilities
    // ============
    // Define your capabilities here. WebdriverIO can run multiple capabilities at the same
    // time. Depending on the number of capabilities, WebdriverIO launches several test
    // sessions. Within your `capabilities`, you can overwrite the `spec` and `exclude`
    // options in order to group specific specs to a specific capability.
    //
    capabilities: [{
        // Capabilities are set dynamically based on platform
        ...appConfig.getPlatformConfig(process.env.PLATFORM === 'ios' ? 'ios' : 'android')
    }],

    logLevel: 'info',
    bail: 0,
    baseUrl: '',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,

    services: [
        ['appium', {
            args: {
                address: 'localhost',
                port: 4723,
                relaxedSecurity: true
            }
        }]
    ],

    framework: 'mocha',
    reporters: [
        'spec',
        ['allure', {
            outputDir: 'allure-results',
            disableWebdriverStepsReporting: true,
            disableWebdriverScreenshotsReporting: false,
        }]
    ],

    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },

    before: function () {
        global.allure = none;
    },

    beforeSession: function () {
        console.log('Looking for specs in:', `./src/apps/${process.env.APP_NAME}/tests/**/*.test.js`);
    }
};
