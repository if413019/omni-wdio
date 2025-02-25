import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ConfigurationManager {
    constructor() {
        this.config = {};
        this.loadEnvironmentConfig();
    }

    static getInstance() {
        if (!ConfigurationManager.instance) {
            ConfigurationManager.instance = new ConfigurationManager();
        }
        return ConfigurationManager.instance;
    }

    loadEnvironmentConfig() {
        const appName = process.env.APP_NAME || 'sample_app';
        const environment = process.env.APP_ENV || 'qa';
        
        // Load base environment variables
        dotenv.config({
            path: path.resolve(process.cwd(), '.env')
        });

        // Load app-specific environment variables
        dotenv.config({
            path: path.resolve(process.cwd(), `src/apps/${appName}/config/.env.${environment}`)
        });

        this.config = {
            appName,
            environment,
            android: {
                'platformName': 'Android',
                'appium:automationName': 'UiAutomator2',
                'appium:app': path.resolve(process.cwd(), process.env.ANDROID_APP_PATH),
                'appium:packageName': process.env.ANDROID_APP_PACKAGE
            },
            ios: {
                platformName: 'iOS',
                'appium:automationName': 'XCUITest',
                'appium:udid': process.env.IOS_DEVICE_UDID,
                'appium:bundleId': process.env.IOS_BUNDLE_ID
            }
        };
    }

    getConfig() {
        return this.config;
    }

    getPlatformConfig(platform) {
        return this.config[platform];
    }

    getAppName() {
        return this.config.appName;
    }

    getEnvironment() {
        return this.config.environment;
    }
}

export const config = ConfigurationManager.getInstance();
