import {
    findElement,
    findElements,
    tapElement,
    setValueOnElement,
    clearAndSetValue,
    longPressElement,
    swipeBetweenElements,
    swipeOnScreen,
    scrollToFindElement,
    tapByCoordinates,
    waitForElementVisible,
    waitForElementNotVisible,
    waitForCondition,
    handleAlert,
    elementHasText,
    takeScreenshot
} from './elementAction.js';

/**
 * Base Page Object class with advanced interaction methods
 */
export class BasePage {
    constructor() {
        this.driver = global.browser;
        this.platform = process.env.PLATFORM || 'android';
        this.isAndroid = this.platform === 'android';
        this.isIOS = this.platform === 'ios';
        this.pageLoadTimeout = 30000;
    }

    /**
     * Wait for the page to be fully loaded
     * Override in subclasses with specific loading indicators
     * @param {number} timeout - Timeout in ms
     */
    async waitForPageLoaded(timeout = this.pageLoadTimeout) {
        // Default implementation waits for page to settle
        // Override in specific page objects with specific loading indicators
        await this.driver.pause(500); // Small pause for stability
    }

    /**
     * Click on an element
     * @param {string} selector - Element selector
     */
    async click(selector) {
        await tapElement(this.driver, selector);
    }

    /**
     * Double click on an element
     * @param {string} selector - Element selector
     */
    async doubleClick(selector) {
        const element = await findElement(this.driver, selector);
        await element.doubleClick();
    }

    /**
     * Long press on an element
     * @param {string} selector - Element selector
     * @param {number} duration - Duration in ms
     */
    async longPress(selector, duration = 2000) {
        await longPressElement(this.driver, selector, duration);
    }

    /**
     * Set value on an element
     * @param {string} selector - Element selector
     * @param {string} value - Value to set
     */
    async setValue(selector, value) {
        await setValueOnElement(this.driver, selector, value);
    }

    /**
     * Clear field and set value
     * @param {string} selector - Element selector
     * @param {string} value - Value to set
     */
    async clearAndSetValue(selector, value) {
        await clearAndSetValue(this.driver, selector, value);
    }

    /**
     * Get text from an element
     * @param {string} selector - Element selector
     * @returns {string} Element text
     */
    async getText(selector) {
        const element = await findElement(this.driver, selector);
        return element.getText();
    }

    /**
     * Check if element exists
     * @param {string} selector - Element selector
     * @returns {boolean} True if element exists
     */
    async isExisting(selector) {
        const element = await this.driver.$(selector);
        return element.isExisting();
    }

    /**
     * Check if element is displayed
     * @param {string} selector - Element selector
     * @returns {boolean} True if element is displayed
     */
    async isDisplayed(selector) {
        try {
            const element = await this.driver.$(selector);
            return element.isDisplayed();
        } catch (error) {
            return false;
        }
    }

    /**
     * Check if element is enabled
     * @param {string} selector - Element selector
     * @returns {boolean} True if element is enabled
     */
    async isEnabled(selector) {
        const element = await findElement(this.driver, selector);
        return element.isEnabled();
    }

    /**
     * Check if element has a specific text
     * @param {string} selector - Element selector
     * @param {string} expectedText - Expected text
     * @param {boolean} exactMatch - Whether to require exact match
     * @returns {boolean} True if element has the text
     */
    async hasText(selector, expectedText, exactMatch = false) {
        return elementHasText(this.driver, selector, expectedText, exactMatch);
    }

    /**
     * Swipe in a direction on the screen
     * @param {string} direction - Direction to swipe: 'up', 'down', 'left', 'right'
     * @param {number} percentage - Percentage of screen to swipe (0-1)
     */
    async swipe(direction, percentage = 0.5) {
        await swipeOnScreen(this.driver, direction, percentage);
    }

    /**
     * Swipe from one element to another
     * @param {string} fromSelector - Starting element selector
     * @param {string} toSelector - Ending element selector
     * @param {number} duration - Swipe duration in ms
     */
    async swipeBetween(fromSelector, toSelector, duration = 800) {
        await swipeBetweenElements(this.driver, fromSelector, toSelector, duration);
    }

    /**
     * Scroll until an element is found
     * @param {string} selector - Element to find
     * @param {string} direction - Direction to scroll: 'up', 'down', 'left', 'right'
     * @param {number} maxScrolls - Maximum number of scroll attempts
     * @returns {Object} Found element
     */
    async scrollToElement(selector, direction = 'down', maxScrolls = 10) {
        return scrollToFindElement(this.driver, selector, direction, maxScrolls);
    }

    /**
     * Wait for an element to be visible
     * @param {string} selector - Element selector
     * @param {number} timeout - Timeout in ms
     * @returns {Object} WebdriverIO element
     */
    async waitForVisible(selector, timeout) {
        return waitForElementVisible(this.driver, selector, timeout);
    }

    /**
     * Wait for an element to disappear
     * @param {string} selector - Element selector
     * @param {number} timeout - Timeout in ms
     * @returns {boolean} True if element disappears
     */
    async waitForNotVisible(selector, timeout) {
        return waitForElementNotVisible(this.driver, selector, timeout);
    }

    /**
     * Wait for a custom condition
     * @param {Function} condition - Condition function returning a promise
     * @param {string} errorMessage - Error message if condition times out
     * @param {number} timeout - Timeout in ms
     * @returns {boolean} True if condition is met
     */
    async waitForCondition(condition, errorMessage, timeout) {
        return waitForCondition(this.driver, condition, errorMessage, timeout);
    }

    /**
     * Handle a native alert
     * @param {boolean} accept - Whether to accept or dismiss the alert
     * @param {string} text - Text to enter into alert prompt (if applicable)
     */
    async handleAlert(accept = true, text = null) {
        await handleAlert(this.driver, accept, text);
    }

    /**
     * Take a screenshot with a prefix
     * @param {string} prefix - Screenshot name prefix
     * @returns {string} Path to saved screenshot
     */
    async takeScreenshot(prefix) {
        const pageName = this.constructor.name;
        return takeScreenshot(this.driver, `${prefix}_${pageName}`);
    }

    /**
     * Get all elements matching a selector
     * @param {string} selector - Element selector
     * @returns {Array} Array of WebdriverIO elements
     */
    async getElements(selector) {
        return findElements(this.driver, selector);
    }

    /**
     * Select item from a list by text
     * @param {string} listSelector - List element selector
     * @param {string} itemTextToSelect - Text of the item to select
     * @param {string} itemSelector - Individual item selector (default: list selector)
     * @param {string} scrollDirection - Direction to scroll: 'up', 'down', 'left', 'right'
     * @param {number} maxScrolls - Maximum number of scroll attempts
     */
    async selectListItemByText(
        listSelector,
        itemTextToSelect,
        itemSelector = null,
        scrollDirection = 'down',
        maxScrolls = 10
    ) {
        const actualItemSelector = itemSelector || listSelector;
        let found = false;
        let scrolls = 0;
        
        // First check if item is already visible
        const visibleItems = await findElements(this.driver, actualItemSelector);
        for (const item of visibleItems) {
            const text = await item.getText();
            if (text.includes(itemTextToSelect)) {
                await item.click();
                found = true;
                break;
            }
        }
        
        // If not found, scroll and look for it
        while (!found && scrolls < maxScrolls) {
            await this.swipe(scrollDirection);
            scrolls++;
            
            const items = await findElements(this.driver, actualItemSelector);
            for (const item of items) {
                const text = await item.getText();
                if (text.includes(itemTextToSelect)) {
                    await item.click();
                    found = true;
                    break;
                }
            }
            
            if (found) break;
        }
        
        if (!found) {
            throw new Error(`Item with text "${itemTextToSelect}" not found in list after ${scrolls} scrolls`);
        }
    }

    /**
     * Fill a form with provided data
     * @param {Object} formData - Object with selectors as keys and values to set
     */
    async fillForm(formData) {
        for (const [selector, value] of Object.entries(formData)) {
            await this.clearAndSetValue(selector, value);
        }
    }

    /**
     * Check if an element exists within a timeout
     * @param {string} selector - Element selector
     * @param {number} timeout - Timeout in ms
     * @returns {boolean} True if element exists
     */
    async waitForExist(selector, timeout = 5000) {
        try {
            const element = await this.driver.$(selector);
            return element.waitForExist({ timeout });
        } catch (error) {
            return false;
        }
    }

    /**
     * Execute a platform-specific action
     * @param {Function} androidAction - Function to execute for Android
     * @param {Function} iOSAction - Function to execute for iOS
     * @returns {any} Result of the executed action
     */
    async executePlatformSpecific(androidAction, iOSAction) {
        if (this.isAndroid) {
            return androidAction();
        } else if (this.isIOS) {
            return iOSAction();
        }
    }

    /**
     * Navigate back (uses platform-specific implementation)
     */
    async navigateBack() {
        if (this.isAndroid) {
            await this.driver.back();
        } else if (this.isIOS) {
            // In iOS, usually there's a back button to tap
            const backButton = await this.driver.$('~back');
            if (await backButton.isDisplayed()) {
                await backButton.click();
            } else {
                // Try standard navigation
                await this.driver.back();
            }
        }
    }

    /**
     * Get attribute value from an element
     * @param {string} selector - Element selector
     * @param {string} attributeName - Name of the attribute
     * @returns {string} Attribute value
     */
    async getAttribute(selector, attributeName) {
        const element = await findElement(this.driver, selector);
        return element.getAttribute(attributeName);
    }

    /**
     * Verify a list of elements exists and is displayed
     * @param {Array<string>} selectors - Array of element selectors
     * @returns {boolean} True if all elements exist and are displayed
     */
    async verifyElementsDisplayed(selectors) {
        for (const selector of selectors) {
            if (!(await this.isDisplayed(selector))) {
                return false;
            }
        }
        return true;
    }
}
