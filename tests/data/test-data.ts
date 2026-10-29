// Expected values used across the step definitions. Change them here, not in the steps.

export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

// Command used to start the app when it isn't already running
export const SERVER_COMMAND = (process.env.SERVER_COMMAND ?? 'npx tsx api/server.ts').split(' ');

export const PIZZAS = {
    margherita: 'Margherita Pizza',
    pepperoni: 'Pepperoni Pizza',
    quattro: 'Quattro Stagioni',
    vegetarian: 'Vegetarian Delight',
    bbqChicken: 'BBQ Chicken Pizza',
};

// Items used when a scenario needs an order but doesn't care about its contents
export const DEFAULT_ORDER_ITEMS = [
    { name: PIZZAS.margherita, quantity: 1 },
    { name: PIZZAS.pepperoni, quantity: 2 },
];
export const SINGLE_ORDER_ITEM = [{ name: PIZZAS.margherita, quantity: 1 }];

// Seeded orders. Read-only: never change their status in a test.
export const SEED_ORDERS = {
    delivering: { id: 'order-002', sender: 'Jane Smith' },
};

export const VALID_USER = { username: 'user', password: 'pass' };

export const STORAGE_KEYS = { authToken: 'auth_token', theme: 'theme' };

export const MESSAGES = {
    loginRequired: 'only visible to logged-in users',
    successPlacedPattern: /^Order placed successfully! Order ID: order-\d+-\d+$/,
    orderPlaced: (id: string) => `Order placed successfully! Order ID: ${id}`,
};

// Global the XSS payloads in the feature files try to set
export const XSS_MARKER = '__xss';

// Inline SVG the UI swaps in when a menu image fails to load
export const PLACEHOLDER_IMAGE_PREFIX = 'data:image/svg+xml;base64,';

/**
 * Gherkin trims table cells, so values that need leading/trailing spaces
 * or are generated are written as tokens:
 *   [blank]       → ""
 *   [whitespace]  → "   "
 *   [200 chars]   → a 200 character name
 */
export function resolveText(value: string): string {
    if (value === '[blank]') return '';
    if (value === '[whitespace]') return '   ';
    const length = value.match(/^\[(\d+) chars\]$/);
    if (length) return 'Ä'.repeat(Number(length[1]));
    return value;
}

/** Escapes a string so it can be used literally inside a RegExp. */
export const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');

let counter = 0;
/** Unique customer name so parallel scenarios never collide. */
export function uniqueName(prefix = 'Tester'): string {
    counter += 1;
    return `${prefix} ${Date.now()}-${process.pid}-${counter}`;
}
