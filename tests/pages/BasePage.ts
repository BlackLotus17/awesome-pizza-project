import { Locator, Page } from '@playwright/test';

/** Parts shared by every page: header, theme toggle, generic controls and browser state. */
export abstract class BasePage {
    readonly html: Locator;
    readonly heading: Locator;
    readonly themeToggle: Locator;

    static readonly THEME_ATTRIBUTE = 'data-theme';

    protected constructor(readonly page: Page, readonly path: string) {
        this.html = page.locator('html');
        this.heading = page.getByRole('heading', { level: 1 });
        this.themeToggle = page.getByRole('button', { name: 'Toggle dark theme' });
    }

    async goto(): Promise<void> {
        await this.page.goto(this.path);
    }

    async toggleTheme(): Promise<void> {
        await this.themeToggle.click();
    }

    // Generic controls, for steps that name the control in the feature file

    link(name: string): Locator {
        return this.page.getByRole('link', { name });
    }

    button(name: string): Locator {
        return this.page.getByRole('button', { name, exact: true });
    }

    field(label: string): Locator {
        return this.page.getByLabel(label, { exact: true });
    }

    text(text: string): Locator {
        return this.page.getByText(text);
    }

    // Browser state

    storageItem(key: string): Promise<string | null> {
        return this.page.evaluate(k => localStorage.getItem(k), key);
    }

    async setStorageItem(key: string, value: string): Promise<void> {
        await this.page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, value]);
    }

    windowValue(name: string): Promise<unknown> {
        return this.page.evaluate(n => (window as any)[n], name);
    }

    /** True when the document is wider than the viewport. */
    hasHorizontalScroll(): Promise<boolean> {
        return this.page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    }

    isFocused(target: Locator): Promise<boolean> {
        return target.evaluate(el => el === document.activeElement);
    }

    /** Whether the focused element shows a keyboard focus ring (outline or box-shadow). */
    focusIndicator(): Promise<{ focusVisible: boolean; hasIndicator: boolean }> {
        return this.page.evaluate(() => {
            const el = document.activeElement as HTMLElement;
            const style = getComputedStyle(el);
            return { focusVisible: el.matches(':focus-visible'), hasIndicator: style.outlineStyle !== 'none' || style.boxShadow !== 'none' };
        });
    }
}
