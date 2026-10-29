import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { MenuSection } from './MenuSection';
import { CartSection } from './CartSection';
import { OrderManagement } from './OrderManagement';
import { Notification } from './Notification';

/** The ordering page at `/`. Composes the menu, cart, order-management and notification parts. */
export class HomePage extends BasePage {
    readonly subtitle: Locator;
    readonly loginLink: Locator;
    readonly notification: Notification;
    readonly menu: MenuSection;
    readonly cart: CartSection;
    readonly orders: OrderManagement;

    constructor(page: Page) {
        super(page, '/');
        this.subtitle = page.locator('header p');
        this.loginLink = page.getByRole('link', { name: '🔒 Login' });
        this.notification = new Notification(page);
        this.menu = new MenuSection(page);
        this.cart = new CartSection(page);
        this.orders = new OrderManagement(page);
    }

    /** Opens the page and waits until the menu has rendered. */
    async open(): Promise<void> {
        await this.goto();
        await this.menu.cards.first().waitFor();
    }

    sectionHeading(name: string): Locator {
        return this.page.getByRole('heading', { level: 2, name, exact: true });
    }
}
