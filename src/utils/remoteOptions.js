import { config } from './config.js';

export const getRemoteOptions = (platform) => {
    const platformConfig = config.getPlatformConfig(platform);
    
    return {
        protocol: 'http',
        hostname: 'localhost',
        port: 4723,
        path: '/',
        capabilities: {
            ...platformConfig,
            // Additional capabilities that might be needed
            'appium:newCommandTimeout': 3600,
            'appium:noReset': false,
            'appium:fullReset': true,
        }
    };
};
