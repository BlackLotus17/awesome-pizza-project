import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PizzaWorld } from '../support/world';
import { Notification } from '../pages/Notification';
import { MESSAGES } from '../data/test-data';

// Navigation

Given(/^I open the (home page|login page|protected page)$/, async function (this: PizzaWorld, target: string) {
    if (target === 'home page') await this.home.open();
    else if (target === 'login page') await this.loginPage.goto();
    else await this.protectedPage.goto();
});

When('I open the home page without waiting for the menu', async function (this: PizzaWorld) {
    await this.home.goto();
});

When('I reload the page', async function (this: PizzaWorld) {
    await this.page.reload();
});

Then('the page title is {string}', async function (this: PizzaWorld, title: string) {
    await expect(this.page).toHaveTitle(title);
});

Then('I am on {string}', async function (this: PizzaWorld, pathname: string) {
    await expect(this.page).toHaveURL(url => url.pathname === pathname);
});

Then('the page has no horizontal scroll', async function (this: PizzaWorld) {
    expect(await this.home.hasHorizontalScroll()).toBe(false);
});

Given('the browser window is {int} by {int} pixels', async function (this: PizzaWorld, width: number, height: number) {
    await this.page.setViewportSize({ width, height });
});

// Notifications

Then(/^an? (success|error) notification says "(.*)"$/, async function (this: PizzaWorld, type: string, message: string) {
    await expect(this.home.notification.root).toHaveText(message);
    await expect(this.home.notification.root).toHaveClass(Notification.typeClass(type));
    await expect(this.home.notification.root).toHaveClass(Notification.SHOWN);
});

Then('an error notification is shown', async function (this: PizzaWorld) {
    await expect(this.home.notification.root).toHaveClass(Notification.typeClass('error'));
    await expect(this.home.notification.root).toHaveClass(Notification.SHOWN);
});

Then('a success notification shows the new order ID', async function (this: PizzaWorld) {
    const expected = this.order ? MESSAGES.orderPlaced(this.order.id) : MESSAGES.successPlacedPattern;
    await expect(this.home.notification.root).toHaveText(expected);
    await expect(this.home.notification.root).toHaveClass(Notification.typeClass('success'));
});

Then('the notification is visible with the {string} style', async function (this: PizzaWorld, type: string) {
    await expect(this.home.notification.root).toHaveClass(Notification.typeClass(type));
    await expect(this.home.notification.root).toHaveClass(Notification.SHOWN);
    await expect(this.home.notification.root).toBeInViewport();
});

Then('the notification is still visible', async function (this: PizzaWorld) {
    await expect(this.home.notification.root).toHaveClass(Notification.SHOWN);
});

Then('the notification is hidden', async function (this: PizzaWorld) {
    await expect(this.home.notification.root).not.toHaveClass(Notification.SHOWN);
});

// Clock

Given('the browser clock is controlled by the test', async function (this: PizzaWorld) {
    await this.page.clock.install();
});

When('{int} milliseconds pass', async function (this: PizzaWorld, ms: number) {
    await this.page.clock.runFor(ms);
});

// Console and network

Then('there are no console errors', async function (this: PizzaWorld) {
    await this.page.waitForLoadState('networkidle');
    expect(this.consoleErrors).toEqual([]);
});

Then('there are no failed requests', async function (this: PizzaWorld) {
    expect(this.failedRequests).toEqual([]);
});
