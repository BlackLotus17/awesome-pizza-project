import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProtectedPage extends BasePage {
    readonly logoutButton: Locator;
    readonly loginRequiredMessage: Locator;
    readonly loginLink: Locator;
    readonly welcomeText: Locator;
    readonly data: Locator;
    readonly cards: Locator;

    constructor(page: Page) {
        super(page, '/protected.html');
        this.logoutButton = page.getByRole('button', { name: '🚪 Logout' });
        this.loginRequiredMessage = page.locator('#auth-required-msg');
        this.loginLink = this.loginRequiredMessage.getByRole('link', { name: 'Log in' });
        this.welcomeText = page.getByText('Welcome! You are logged in.');
        this.data = page.locator('#protected-data');
        this.cards = this.data.locator('.protected-card');
    }

    card(label: string): Locator {
        return this.cards.filter({ has: this.page.locator('.protected-label', { hasText: label }) });
    }

    /** Card body text: list items joined with ", " or the single value. */
    async cardValue(label: string): Promise<string> {
        const card = this.card(label);
        const listItems = await card.locator('li').allTextContents();
        if (listItems.length) return listItems.map(s => s.trim()).join(', ');
        return (await card.locator('.protected-value').textContent())?.trim() ?? '';
    }

    async logout(): Promise<void> {
        await this.logoutButton.click();
    }
}
