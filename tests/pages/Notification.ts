import { Locator, Page } from '@playwright/test';

export type NotificationType = 'success' | 'error';

/** Toast shown after actions on the home page. It slides in by adding the `show` class. */
export class Notification {
    readonly root: Locator;

    static readonly SHOWN = /\bshow\b/;

    constructor(page: Page) {
        this.root = page.locator('#notification');
    }

    static typeClass(type: string): RegExp {
        return new RegExp(`\\b${type}\\b`);
    }
}
