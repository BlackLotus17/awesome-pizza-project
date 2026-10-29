import { DataTable, Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PizzaWorld } from '../support/world';
import { failLogin, failProtected, slowLogin } from '../support/mocks';
import { MESSAGES, STORAGE_KEYS, VALID_USER, resolveText } from '../data/test-data';
import { API, pathOf } from '../data/api-routes';

/** Puts a token in localStorage without going through the login form. */
async function saveToken(world: PizzaWorld, token: string): Promise<void> {
    await world.loginPage.goto();
    await world.loginPage.setStorageItem(STORAGE_KEYS.authToken, token);
}

Given('I am logged in', async function (this: PizzaWorld) {
    await saveToken(this, await this.api.loginToken(VALID_USER.username, VALID_USER.password));
});

Given('an invalid auth token {string} is saved', async function (this: PizzaWorld, token: string) {
    await saveToken(this, token);
});

When('I click the {string} link', async function (this: PizzaWorld, name: string) {
    await this.home.link(name).click();
});

Then('the login hint says {string}', async function (this: PizzaWorld, hint: string) {
    await expect(this.loginPage.hint).toHaveText(hint);
});

When('I log in as {string} with password {string} using the button', async function (this: PizzaWorld, username: string, password: string) {
    await this.loginPage.login(resolveText(username), resolveText(password), 'button');
});

When('I log in as {string} with password {string} using Enter', async function (this: PizzaWorld, username: string, password: string) {
    await this.loginPage.login(resolveText(username), resolveText(password), 'Enter');
});

When('I log out', async function (this: PizzaWorld) {
    await this.protectedPage.logout();
});

Then('an auth token is saved', async function (this: PizzaWorld) {
    await expect.poll(() => this.loginPage.storageItem(STORAGE_KEYS.authToken)).toBeTruthy();
});

Then('no auth token is saved', async function (this: PizzaWorld) {
    await this.page.waitForLoadState();
    await expect.poll(() => this.loginPage.storageItem(STORAGE_KEYS.authToken)).toBeNull();
});

Then('the login error says {string}', async function (this: PizzaWorld, message: string) {
    await expect(this.loginPage.error).toBeVisible();
    await expect(this.loginPage.error).toHaveText(message);
});

Given('the login API responds slowly', async function (this: PizzaWorld) {
    await slowLogin(this.page);
});

Then('the login error is hidden while the request is in flight', async function (this: PizzaWorld) {
    await expect(this.loginPage.error).toBeHidden({ timeout: 1000 });
});

Given('the login API is unreachable', async function (this: PizzaWorld) {
    await failLogin(this.page);
});

Then('the protected page shows these cards:', async function (this: PizzaWorld, table: DataTable) {
    const rows = table.hashes();
    await expect(this.protectedPage.cards).toHaveCount(rows.length);
    for (const { label, value } of rows) {
        await expect.poll(() => this.protectedPage.cardValue(label)).toBe(value);
    }
});

Then('the protected page shows {int} cards', async function (this: PizzaWorld, count: number) {
    await expect(this.protectedPage.cards).toHaveCount(count);
});

Then('the Logout button is visible', async function (this: PizzaWorld) {
    await expect(this.protectedPage.logoutButton).toBeVisible();
});

Then('the protected page shows the logged-out view', async function (this: PizzaWorld) {
    await expect(this.protectedPage.loginRequiredMessage).toBeVisible();
    await expect(this.protectedPage.loginRequiredMessage).toContainText(MESSAGES.loginRequired);
    await expect(this.protectedPage.logoutButton).toBeHidden();
    await expect(this.protectedPage.cards).toHaveCount(0);
});

Then('the login-required message links to {string}', async function (this: PizzaWorld, href: string) {
    await expect(this.protectedPage.loginLink).toHaveAttribute('href', href);
});

Then('the text {string} is not shown', async function (this: PizzaWorld, text: string) {
    await expect(this.home.text(text)).toBeHidden();
});

Given(/^the protected API returns (server error|network error)$/, async function (this: PizzaWorld, mode: 'server error' | 'network error') {
    await failProtected(this.page, mode);
});

Then('the protected area says {string}', async function (this: PizzaWorld, message: string) {
    await expect(this.protectedPage.data).toHaveText(message);
});

Then('the password field is masked', async function (this: PizzaWorld) {
    await expect(this.loginPage.passwordInput).toHaveAttribute('type', 'password');
});

Then('the login request sent the credentials in the body, not the URL', async function (this: PizzaWorld) {
    await expect.poll(() => this.requestsTo('POST', API.login).length).toBe(1);
    const [login] = this.requestsTo('POST', API.login);
    expect(new URL(login.url).search).toBe('');
    expect(JSON.parse(login.postData!)).toEqual({ username: VALID_USER.username, password: VALID_USER.password });
});
