/**
 * Registry for managing page objects across tests
 */
export class PageRegistry {
    constructor() {
        this.apps = new Map();
    }

    /**
     * Register an app's page class
     * @param {string} appName - Name of the app (e.g., 'sample_app')
     * @param {string} pageName - Name of the page (e.g., 'login')
     * @param {typeof BasePage} PageClass - Page class to register
     */
    register(appName, pageName, PageClass) {
        if (!this.apps.has(appName)) {
            this.apps.set(appName, new Map());
        }
        
        const appPages = this.apps.get(appName);
        appPages.set(pageName, {
            Class: PageClass,
            instance: null
        });
    }

    /**
     * Get all registered pages for an app
     * @param {string} appName - Name of the app
     * @returns {Map<string, {Class: typeof BasePage, instance: BasePage|null}>} Map of page name to page info
     */
    getAppPages(appName) {
        return this.apps.get(appName) || new Map();
    }

    /**
     * Get a page instance, creating it if it doesn't exist
     * @param {string} appName - Name of the app
     * @param {string} pageName - Name of the page
     * @returns {BasePage} Page instance
     */
    get(appName, pageName) {
        const appPages = this.apps.get(appName);
        if (!appPages) {
            throw new Error(`App "${appName}" not registered`);
        }

        const page = appPages.get(pageName);
        if (!page) {
            throw new Error(`Page "${pageName}" not registered for app "${appName}"`);
        }

        if (!page.instance) {
            page.instance = new page.Class();
        }

        return page.instance;
    }

    /**
     * Reset all page instances for all apps
     */
    reset() {
        for (const appPages of this.apps.values()) {
            for (const page of appPages.values()) {
                page.instance = null;
            }
        }
    }
}

// Create singleton instance
export const pageRegistry = new PageRegistry();
