# Advanced Actions for Mobile Automation

This document outlines the advanced actions and interactions available in the mobile automation framework. These actions are designed to handle complex UI interactions in mobile applications.

## Table of Contents

1. [Element Actions](#element-actions)
2. [Gestures and Touch Actions](#gestures-and-touch-actions)
3. [Wait Conditions](#wait-conditions)
4. [Form Handling](#form-handling)
5. [List and Grid Interactions](#list-and-grid-interactions)
6. [Platform-Specific Actions](#platform-specific-actions)
7. [Error Handling and Screenshots](#error-handling-and-screenshots)
8. [Complex Workflows](#complex-workflows)

## Element Actions

The framework provides a rich set of element actions beyond the basic click and setValue:

```javascript
// Get elements
const element = await findElement(driver, selector);
const elements = await findElements(driver, selector);

// Click operations
await tapElement(driver, selector);
await longPressElement(driver, selector, 2000); // 2 seconds press
await tapByCoordinates(driver, x, y);

// Input operations
await setValueOnElement(driver, selector, value);
await clearAndSetValue(driver, selector, value);

// Element state
const text = await element.getText();
const isVisible = await element.isDisplayed();
const isEnabled = await element.isEnabled();
const hasText = await elementHasText(driver, selector, expectedText);
const attribute = await element.getAttribute(attributeName);
```

These are available directly in your Page Objects:

```javascript
// In your page object class:
await this.click(selector);
await this.longPress(selector);
await this.setText(selector, value);
await this.clearAndSetValue(selector, value);
await this.getText(selector);
await this.isDisplayed(selector);
await this.hasText(selector, expectedText);
await this.getAttribute(selector, attributeName);
```

## Gestures and Touch Actions

Complex gestures are supported for modern mobile interfaces:

```javascript
// Swipe in a direction
await swipeOnScreen(driver, 'up'); // direction: up, down, left, right
await swipeOnScreen(driver, 'down', 0.7); // 70% of screen height

// Swipe between elements
await swipeBetweenElements(driver, startElementSelector, endElementSelector);

// In page objects:
await this.swipe('up');
await this.swipe('down', 0.7);
await this.swipeBetween(fromSelector, toSelector);
```

## Wait Conditions

Advanced waiting mechanisms for complex UIs:

```javascript
// Wait for element states
await waitForElementVisible(driver, selector, timeout);
await waitForElementNotVisible(driver, selector, timeout);

// Wait for custom conditions
await waitForCondition(
    driver,
    async () => {
        const element = await driver.$(selector);
        return (await element.getText()) === expectedText;
    },
    'Text never matched expected value',
    10000
);

// In page objects:
await this.waitForVisible(selector, timeout);
await this.waitForNotVisible(selector, timeout);
await this.waitForCondition(async () => {
    return (await this.getText(selector)) === expectedText;
}, 'Error message', timeout);
```

## Form Handling

Efficient form filling and validation:

```javascript
// In page objects:
await this.fillForm({
    '~username-field': 'testuser',
    '~email-field': 'test@example.com',
    '~password-field': 'SecurePassword123',
    '~age-field': '25'
});

// Form validation
const isFormValid = await this.verifyElementsDisplayed([
    '~username-checkmark', 
    '~email-checkmark', 
    '~password-checkmark'
]);
```

## List and Grid Interactions

Handle lists and grids with dynamic content:

```javascript
// Select item from list by text
await this.selectListItemByText(
    '~list-container',  // List container selector
    'Desired Item Text', // Text to find and select
    '~list-item',       // Individual item selector
    'down',             // Scroll direction
    10                  // Max scrolls
);

// Scroll to find element
const element = await this.scrollToElement('~target-element', 'down');
```

## Platform-Specific Actions

Execute different actions based on platform:

```javascript
// Execute different code per platform
await this.executePlatformSpecific(
    // Android action
    async () => {
        await this.driver.pressKeyCode(4); // Back key
    },
    // iOS action
    async () => {
        await this.click('~back-button');
    }
);

// Platform-specific navigation
await this.navigateBack(); // Handles differences between iOS and Android
```

## Error Handling and Screenshots

Enhanced error handling and debugging:

```javascript
// Take a screenshot
const screenshotPath = await this.takeScreenshot('login-page');

// Handle alerts
await this.handleAlert(true); // Accept alert
await this.handleAlert(false, 'Optional input text'); // Dismiss alert with text input

// In test:
afterEach(async function() {
    // Take screenshot on failure
    if (this.currentTest.state === 'failed') {
        await page.takeScreenshot(`failure_${this.currentTest.title}`);
    }
});
```

## Complex Workflows

Composing actions into workflows for complex scenarios:

```javascript
// Login workflow
async login(username, password, rememberMe = false) {
    await this.waitForPageLoaded();
    
    await this.clearAndSetValue(this.usernameInput, username);
    await this.clearAndSetValue(this.passwordInput, password);
    
    if (rememberMe) {
        await this.click(this.rememberMeCheckbox);
    }
    
    await this.click(this.loginButton);
    await this.waitForNotVisible(this.loadingIndicator);
    
    // Handle potential alerts
    try {
        await this.handleAlert(true);
    } catch (e) {
        // No alert present, continue
    }
}

// Complex verification
async verifyDashboard() {
    // Wait for dashboard to load
    await this.waitForPageLoaded();
    
    // Verify multiple elements exist
    const criticalElements = [
        '~balance-widget',
        '~recent-transactions',
        '~quick-actions'
    ];
    
    return this.verifyElementsDisplayed(criticalElements);
}
```

## Best Practices

1. **Wait for Page Loading**: Always wait for page to be fully loaded before interacting with elements
2. **Handle Loading States**: Monitor and wait for loading indicators to disappear
3. **Platform Differences**: Use executePlatformSpecific for iOS/Android differences
4. **Scrollable Content**: Don't assume elements are visible, use scrollToElement
5. **Error Screenshots**: Take screenshots on test failures for debugging
6. **Element Existence**: Always check if elements exist before interacting
7. **Complex Gestures**: Build complex gesture sequences for advanced interactions

## Example Usage in Tests

```javascript
it('should complete a complex login flow', async function() {
    // Navigate through onboarding banners
    await nanovest.login.browseBannerItems(3);
    
    // Show help tooltip
    const helpText = await nanovest.login.showHelpTooltip();
    expect(helpText).to.include('help');
    
    // Login with remember me
    const validUser = testDataManager.getUser('valid');
    await nanovest.login.login(validUser.email, validUser.password, true);
    
    // Verify successful login
    const isHomePageVisible = await nanovest.login.isHomePageVisible();
    expect(isHomePageVisible).to.be.true;
});