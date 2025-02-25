/**
 * Advanced element interactions for mobile automation
 */

// Wait thresholds
const MAX_ELEMENT_WAIT_THRESHOLD_MS = 5000;
const MAX_CONDITION_WAIT_THRESHOLD_MS = 10000;

/**
 * Find an element with waiting
 * @param {Object} driver - WebdriverIO driver
 * @param {string} elementSelector - Element selector
 * @param {number} timeout - Timeout in ms
 * @returns {Object} WebdriverIO element
 */
async function findElement(driver, elementSelector, timeout = MAX_ELEMENT_WAIT_THRESHOLD_MS) {
    const element = await driver.$(elementSelector);
    await element.waitForExist({ timeout });
    return element;
}

/**
 * Find multiple elements
 * @param {Object} driver - WebdriverIO driver
 * @param {string} elementSelector - Element selector
 * @param {number} timeout - Timeout in ms
 * @returns {Array} Array of WebdriverIO elements
 */
async function findElements(driver, elementSelector, timeout = MAX_ELEMENT_WAIT_THRESHOLD_MS) {
    const elements = await driver.$$(elementSelector);
    // If no elements found within timeout, throw error
    if (elements.length === 0) {
        await driver.waitUntil(
            async () => {
                const foundElements = await driver.$$(elementSelector);
                return foundElements.length > 0;
            },
            {
                timeout,
                timeoutMsg: `No elements found for selector: ${elementSelector}`
            }
        );
        return driver.$$(elementSelector);
    }
    return elements;
}

/**
 * Tap on an element
 * @param {Object} driver - WebdriverIO driver
 * @param {string} elementSelector - Element selector
 * @param {number} timeout - Timeout in ms
 * @returns {Promise} Click operation result
 */
async function tapElement(driver, elementSelector, timeout = MAX_ELEMENT_WAIT_THRESHOLD_MS) {
    const element = await findElement(driver, elementSelector, timeout);
    // Wait for element to be clickable
    await element.waitForClickable({ timeout });
    return element.click();
}

/**
 * Set value on an element
 * @param {Object} driver - WebdriverIO driver
 * @param {string} elementSelector - Element selector
 * @param {string} value - Value to set
 * @param {number} timeout - Timeout in ms
 * @returns {Promise} Set value operation result
 */
async function setValueOnElement(driver, elementSelector, value, timeout = MAX_ELEMENT_WAIT_THRESHOLD_MS) {
    const element = await findElement(driver, elementSelector, timeout);
    await element.waitForEnabled({ timeout });
    await element.setValue(value);
}

/**
 * Clear and set value on an element
 * @param {Object} driver - WebdriverIO driver
 * @param {string} elementSelector - Element selector
 * @param {string} value - Value to set
 * @param {number} timeout - Timeout in ms
 */
async function clearAndSetValue(driver, elementSelector, value, timeout = MAX_ELEMENT_WAIT_THRESHOLD_MS) {
    const element = await findElement(driver, elementSelector, timeout);
    await element.waitForEnabled({ timeout });
    await element.clearValue();
    await element.setValue(value);
}

/**
 * Long press on an element
 * @param {Object} driver - WebdriverIO driver
 * @param {string} elementSelector - Element selector
 * @param {number} duration - Duration in ms
 * @param {number} timeout - Timeout in ms
 */
async function longPressElement(driver, elementSelector, duration = 2000, timeout = MAX_ELEMENT_WAIT_THRESHOLD_MS) {
    const element = await findElement(driver, elementSelector, timeout);
    await element.waitForDisplayed({ timeout });
    
    // Get element location
    const location = await element.getLocation();
    const size = await element.getSize();
    
    // Calculate center point
    const centerX = location.x + (size.width / 2);
    const centerY = location.y + (size.height / 2);
    
    // Perform long press
    await driver.touchAction([
        { action: 'press', x: centerX, y: centerY },
        { action: 'wait', ms: duration },
        { action: 'release' }
    ]);
}

/**
 * Swipe from one element to another
 * @param {Object} driver - WebdriverIO driver
 * @param {string} startElementSelector - Starting element selector
 * @param {string} endElementSelector - Ending element selector
 * @param {number} duration - Swipe duration in ms
 * @param {number} timeout - Timeout in ms
 */
async function swipeBetweenElements(
    driver,
    startElementSelector,
    endElementSelector,
    duration = 800,
    timeout = MAX_ELEMENT_WAIT_THRESHOLD_MS
) {
    const startElement = await findElement(driver, startElementSelector, timeout);
    const endElement = await findElement(driver, endElementSelector, timeout);
    
    const startLocation = await startElement.getLocation();
    const startSize = await startElement.getSize();
    const endLocation = await endElement.getLocation();
    const endSize = await endElement.getSize();
    
    const startX = startLocation.x + (startSize.width / 2);
    const startY = startLocation.y + (startSize.height / 2);
    const endX = endLocation.x + (endSize.width / 2);
    const endY = endLocation.y + (endSize.height / 2);
    
    await driver.touchAction([
        { action: 'press', x: startX, y: startY },
        { action: 'wait', ms: duration },
        { action: 'moveTo', x: endX, y: endY },
        { action: 'release' }
    ]);
}

/**
 * Swipe on the screen in a direction
 * @param {Object} driver - WebdriverIO driver
 * @param {string} direction - Direction to swipe: 'up', 'down', 'left', 'right'
 * @param {number} percentage - Percentage of screen to swipe (0-1)
 * @param {number} duration - Swipe duration in ms
 */
async function swipeOnScreen(driver, direction, percentage = 0.5, duration = 800) {
    // Get screen size
    const windowSize = await driver.getWindowSize();
    const width = windowSize.width;
    const height = windowSize.height;
    
    // Calculate swipe coordinates
    let startX, startY, endX, endY;
    
    switch (direction.toLowerCase()) {
        case 'up':
            startX = width * 0.5;
            startY = height * 0.7;
            endX = width * 0.5;
            endY = height * (0.7 - percentage);
            break;
        case 'down':
            startX = width * 0.5;
            startY = height * 0.3;
            endX = width * 0.5;
            endY = height * (0.3 + percentage);
            break;
        case 'left':
            startX = width * 0.8;
            startY = height * 0.5;
            endX = width * (0.8 - percentage);
            endY = height * 0.5;
            break;
        case 'right':
            startX = width * 0.2;
            startY = height * 0.5;
            endX = width * (0.2 + percentage);
            endY = height * 0.5;
            break;
        default:
            throw new Error(`Invalid swipe direction: ${direction}`);
    }
    
    // Execute swipe
    await driver.touchAction([
        { action: 'press', x: startX, y: startY },
        { action: 'wait', ms: duration },
        { action: 'moveTo', x: endX, y: endY },
        { action: 'release' }
    ]);
}

/**
 * Scroll to find an element (scrolls until element is found or max scrolls reached)
 * @param {Object} driver - WebdriverIO driver
 * @param {string} elementSelector - Element to find
 * @param {string} direction - Direction to scroll: 'up', 'down', 'left', 'right'
 * @param {number} maxScrolls - Maximum number of scroll attempts
 * @returns {Object} Found element or null
 */
async function scrollToFindElement(driver, elementSelector, direction = 'down', maxScrolls = 10) {
    let isVisible = false;
    let scrolls = 0;
    
    // Check if element is already visible
    try {
        const element = await driver.$(elementSelector);
        isVisible = await element.isDisplayed();
        if (isVisible) return element;
    } catch (e) {
        // Element not found yet
    }
    
    // Scroll until element is found or max scrolls reached
    while (!isVisible && scrolls < maxScrolls) {
        await swipeOnScreen(driver, direction);
        scrolls++;
        
        try {
            const element = await driver.$(elementSelector);
            isVisible = await element.isDisplayed();
            if (isVisible) return element;
        } catch (e) {
            // Continue scrolling
        }
    }
    
    if (!isVisible) {
        throw new Error(`Element ${elementSelector} not found after ${maxScrolls} scrolls`);
    }
    
    return driver.$(elementSelector);
}

/**
 * Tap element by coordinates
 * @param {Object} driver - WebdriverIO driver
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
async function tapByCoordinates(driver, x, y) {
    await driver.touchAction([
        { action: 'tap', x, y }
    ]);
}

/**
 * Wait for an element to be visible with timeout
 * @param {Object} driver - WebdriverIO driver
 * @param {string} elementSelector - Element selector
 * @param {number} timeout - Timeout in ms
 * @returns {Object} WebdriverIO element
 */
async function waitForElementVisible(driver, elementSelector, timeout = MAX_ELEMENT_WAIT_THRESHOLD_MS) {
    const element = await driver.$(elementSelector);
    await element.waitForDisplayed({ timeout });
    return element;
}

/**
 * Wait for an element to disappear
 * @param {Object} driver - WebdriverIO driver
 * @param {string} elementSelector - Element selector
 * @param {number} timeout - Timeout in ms
 * @returns {boolean} True if element disappears within timeout
 */
async function waitForElementNotVisible(driver, elementSelector, timeout = MAX_ELEMENT_WAIT_THRESHOLD_MS) {
    try {
        const element = await driver.$(elementSelector);
        
        // If element doesn't exist, return immediately
        if (!(await element.isExisting())) {
            return true;
        }
        
        // Wait for element to not be displayed
        return element.waitForDisplayed({ timeout, reverse: true });
    } catch (e) {
        // If element doesn't exist, we consider it not visible
        return true;
    }
}

/**
 * Wait for a specific condition to be true
 * @param {Object} driver - WebdriverIO driver
 * @param {Function} condition - Condition function that returns a promise resolving to a boolean
 * @param {string} errorMessage - Error message if condition times out
 * @param {number} timeout - Timeout in ms
 * @returns {boolean} True if condition is met
 */
async function waitForCondition(
    driver,
    condition,
    errorMessage = 'Condition not met',
    timeout = MAX_CONDITION_WAIT_THRESHOLD_MS
) {
    try {
        await driver.waitUntil(condition, {
            timeout,
            timeoutMsg: errorMessage
        });
        return true;
    } catch (e) {
        throw new Error(`${errorMessage}: ${e.message}`);
    }
}

/**
 * Handle native alert
 * @param {Object} driver - WebdriverIO driver
 * @param {boolean} accept - Whether to accept or dismiss the alert
 * @param {string} text - Text to enter into alert prompt (if applicable)
 */
async function handleAlert(driver, accept = true, text = null) {
    if (text !== null) {
        await driver.sendAlertText(text);
    }
    
    if (accept) {
        await driver.acceptAlert();
    } else {
        await driver.dismissAlert();
    }
}

/**
 * Check if an element has a specific text
 * @param {Object} driver - WebdriverIO driver
 * @param {string} elementSelector - Element selector
 * @param {string} expectedText - Expected text
 * @param {boolean} exactMatch - Whether to require exact match
 * @param {number} timeout - Timeout in ms
 * @returns {boolean} True if element has the expected text
 */
async function elementHasText(
    driver,
    elementSelector,
    expectedText,
    exactMatch = false,
    timeout = MAX_ELEMENT_WAIT_THRESHOLD_MS
) {
    const element = await findElement(driver, elementSelector, timeout);
    const actualText = await element.getText();
    
    if (exactMatch) {
        return actualText === expectedText;
    } else {
        return actualText.includes(expectedText);
    }
}

/**
 * Take a screenshot with a custom name
 * @param {Object} driver - WebdriverIO driver
 * @param {string} name - Screenshot name
 * @returns {string} Path to saved screenshot
 */
async function takeScreenshot(driver, name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotName = `${name}_${timestamp}.png`;
    
    await driver.saveScreenshot(`./screenshots/${screenshotName}`);
    return screenshotName;
}

export {
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
};
