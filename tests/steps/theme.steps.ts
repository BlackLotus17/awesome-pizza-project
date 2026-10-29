import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { PizzaWorld } from '../support/world';
import { browserName } from '../support/hooks';
import { BasePage } from '../pages/BasePage';
import { STORAGE_KEYS } from '../data/test-data';

When('I toggle the theme', async function (this: PizzaWorld) {
    await this.home.toggleTheme();
});

Then(/^the page is in (dark|light) mode$/, async function (this: PizzaWorld, mode: string) {
    if (mode === 'dark') await expect(this.home.html).toHaveAttribute(BasePage.THEME_ATTRIBUTE, 'dark');
    else await expect(this.home.html).not.toHaveAttribute(BasePage.THEME_ATTRIBUTE);
});

Then('the theme toggle shows {string}', async function (this: PizzaWorld, icon: string) {
    await expect(this.home.themeToggle).toHaveText(icon);
});

Then('the saved theme is {string}', async function (this: PizzaWorld, theme: string) {
    expect(await this.home.storageItem(STORAGE_KEYS.theme)).toBe(theme);
});

Given(/^the page is switched to (dark|light) mode$/, async function (this: PizzaWorld, mode: string) {
    if (mode === 'dark') {
        await this.home.toggleTheme();
        await expect(this.home.html).toHaveAttribute(BasePage.THEME_ATTRIBUTE, 'dark');
    } else {
        await expect(this.home.html).not.toHaveAttribute(BasePage.THEME_ATTRIBUTE);
    }
});

// Cucumber has no toHaveScreenshot, so compare against a stored baseline.
// The first run (or UPDATE_SNAPSHOTS=1) writes the baseline.
Then('the home page matches the screenshot {string}', async function (this: PizzaWorld, name: string) {
    await expect.poll(() => this.home.menu.allImagesSettled()).toBe(true);
    const actual = await this.page.screenshot({ fullPage: true, animations: 'disabled', mask: [this.home.menu.images] });

    const dir = path.resolve(__dirname, '../__screenshots__', browserName, process.platform);
    const baselinePath = path.join(dir, name);
    if (process.env.UPDATE_SNAPSHOTS || !fs.existsSync(baselinePath)) {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(baselinePath, actual);
        this.log(`Baseline written: ${baselinePath}`);
        return;
    }
    if (!fs.readFileSync(baselinePath).equals(actual)) {
        this.attach(actual, 'image/png');
        throw new Error(`Screenshot differs from ${baselinePath}. Run with UPDATE_SNAPSHOTS=1 if the change is intended.`);
    }
});
