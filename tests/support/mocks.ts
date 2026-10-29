import { Page } from '@playwright/test';
import { API, anyHost } from '../data/api-routes';

// page.route helpers for error paths the real server can't easily produce.

export async function failMenu(page: Page, mode: 'server error' | 'success false' | 'network error'): Promise<void> {
    await page.route(anyHost(API.menu), route => {
        if (mode === 'network error') return route.abort();
        return route.fulfill({
            status: mode === 'server error' ? 500 : 200,
            json: { success: false, error: 'Internal server error', message: 'Failed to retrieve daily menu' },
        });
    });
}

export async function failImage(page: Page, imagePath: string): Promise<void> {
    await page.route(anyHost(`/${imagePath}`), route => route.fulfill({ status: 404, body: 'Not found' }));
}

export async function failPlaceOrder(page: Page, mode: 'rejected' | 'network error', message = 'Invalid order data'): Promise<void> {
    await page.route(anyHost(API.orders), route => {
        if (route.request().method() !== 'POST') return route.continue();
        if (mode === 'network error') return route.abort();
        return route.fulfill({ status: 400, json: { success: false, error: 'Bad request', message } });
    });
}

export async function failStatusUpdate(page: Page, mode: 'rejected' | 'network error', message = 'Update not allowed'): Promise<void> {
    await page.route(anyHost(`${API.orderPrefix}*`), route => {
        if (route.request().method() !== 'PUT') return route.continue();
        if (mode === 'network error') return route.abort();
        return route.fulfill({ status: 400, json: { success: false, error: 'Bad request', message } });
    });
}

export async function failLogin(page: Page): Promise<void> {
    await page.route(anyHost(API.login), route => route.abort());
}

export async function slowLogin(page: Page, delayMs = 2000): Promise<void> {
    await page.route(anyHost(API.login), async route => {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        await route.continue().catch(() => undefined);
    });
}

export async function failProtected(page: Page, mode: 'server error' | 'network error'): Promise<void> {
    await page.route(anyHost(API.protected), route => {
        if (mode === 'network error') return route.abort();
        return route.fulfill({ status: 500, json: { success: false, error: 'Internal server error' } });
    });
}
