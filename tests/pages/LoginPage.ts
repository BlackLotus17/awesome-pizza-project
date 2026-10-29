import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
    readonly usernameInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;
    readonly error: Locator;
    readonly hint: Locator;

    constructor(page: Page) {
        super(page, '/login.html');
        this.usernameInput = page.getByLabel('Username:');
        this.passwordInput = page.getByLabel('Password:');
        this.loginButton = page.getByRole('button', { name: 'Login', exact: true });
        this.error = page.locator('#login-error');
        this.hint = page.locator('.login-hint');
    }

    async login(username: string, password: string, submitWith: 'button' | 'Enter' = 'button'): Promise<void> {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        if (submitWith === 'Enter') await this.passwordInput.press('Enter');
        else await this.loginButton.click();
    }
}
