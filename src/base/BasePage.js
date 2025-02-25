import { findElement, tapElement, setValueOnElement } from './elementAction.js';

export class BasePage {
    constructor() {
        this.driver = global.browser;
    }

    async click(selector) {
        await tapElement(this.driver, selector);
    }

    async setValue(selector, value) {
        await setValueOnElement(this.driver, selector, value);
    }

    async getText(selector) {
        const element = await findElement(this.driver, selector);
        return element.getText();
    }

    async isExisting(selector) {
        const element = await this.driver.$(selector);
        return element.isExisting();
    }
}
