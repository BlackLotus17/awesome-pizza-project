import { Locator, Page } from '@playwright/test';

/** "Your Order": customer name, cart lines, total and Place Order. */
export class CartSection {
    readonly nameInput: Locator;
    readonly emptyMessage: Locator;
    readonly lines: Locator;
    readonly totalItems: Locator;
    readonly placeOrderButton: Locator;

    constructor(page: Page) {
        this.nameInput = page.getByLabel('Your Name:');
        this.emptyMessage = page.getByText('Your cart is empty');
        this.lines = page.locator('#cart-items .cart-item');
        this.totalItems = page.locator('#total-items');
        this.placeOrderButton = page.getByRole('button', { name: 'Place Order' });
    }

    line(pizza: string): Locator {
        return this.lines.filter({ has: this.lines.page().locator('.cart-item-name', { hasText: pizza }) });
    }

    lineQuantity(pizza: string): Locator {
        return this.line(pizza).locator('.cart-item-quantity');
    }

    lineNames(): Locator {
        return this.lines.locator('.cart-item-name');
    }

    async remove(pizza: string): Promise<void> {
        await this.line(pizza).getByRole('button', { name: 'Remove' }).click();
    }

    async enterName(name: string): Promise<void> {
        await this.nameInput.fill(name);
    }

    async placeOrder(): Promise<void> {
        await this.placeOrderButton.click();
    }
}
