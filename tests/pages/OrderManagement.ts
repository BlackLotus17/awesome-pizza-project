import { Locator, Page } from '@playwright/test';

/** "Order Management": look up an order and change its status. */
export class OrderManagement {
    readonly orderIdInput: Locator;
    readonly lookupButton: Locator;
    readonly details: Locator;
    readonly orderIdValue: Locator;
    readonly customerValue: Locator;
    readonly statusBadge: Locator;
    readonly items: Locator;
    readonly actionButtons: Locator;

    constructor(page: Page) {
        this.orderIdInput = page.getByLabel('Order ID:');
        this.lookupButton = page.getByRole('button', { name: 'Look Up Order' });
        this.details = page.locator('#order-details');
        this.orderIdValue = this.field('Order ID');
        this.customerValue = this.field('Customer');
        this.statusBadge = this.details.locator('.status-badge');
        this.items = this.details.locator('.content-item');
        this.actionButtons = this.details.getByRole('button');
    }

    /** Value cell next to a label in the order summary. */
    private field(label: string): Locator {
        return this.details
            .locator('.order-info-item')
            .filter({ has: this.details.page().locator('.order-info-label', { hasText: label }) })
            .locator('.order-info-value');
    }

    /** HTML elements inside the customer cell. Plain-text rendering has none. */
    customerMarkup(): Locator {
        return this.customerValue.locator('*');
    }

    item(pizza: string): Locator {
        return this.items.filter({ hasText: pizza });
    }

    itemName(item: Locator): Locator {
        return item.locator('span').first();
    }

    itemQuantity(item: Locator): Locator {
        return item.locator('strong');
    }

    action(name: string): Locator {
        return this.details.getByRole('button', { name });
    }

    async lookUp(orderId: string, via: 'button' | 'Enter' = 'button'): Promise<void> {
        await this.orderIdInput.fill(orderId);
        if (via === 'Enter') await this.orderIdInput.press('Enter');
        else await this.lookupButton.click();
    }
}
