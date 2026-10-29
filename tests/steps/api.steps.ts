import { Given, Then, When } from '@cucumber/cucumber';
import { APIResponse, expect } from '@playwright/test';
import { PizzaWorld } from '../support/world';
import { SINGLE_ORDER_ITEM, VALID_USER, uniqueName } from '../data/test-data';

/** Reads a dotted path such as "data.contents" from the last JSON response. */
function field(world: PizzaWorld, path: string): any {
    return path.split('.').reduce((value, key) => value?.[key], world.responseJson);
}

async function store(world: PizzaWorld, response: APIResponse): Promise<void> {
    world.response = response;
    world.responseJson = await response.json().catch(() => undefined);
}

// Requests

Given('I have logged in via the API', async function (this: PizzaWorld) {
    this.loginToken = await this.api.loginToken(VALID_USER.username, VALID_USER.password);
});

When('I send a {word} request to {string}', async function (this: PizzaWorld, method: string, path: string) {
    await store(this, await this.api.send(method, this.interpolate(path)));
});

When('I send a {word} request to {string} with body:', async function (this: PizzaWorld, method: string, path: string, body: string) {
    await store(this, await this.api.send(method, this.interpolate(path), { data: JSON.parse(this.interpolate(body)) }));
});

When('I send a {word} request to {string} with body {string}', async function (this: PizzaWorld, method: string, path: string, body: string) {
    await store(this, await this.api.send(method, this.interpolate(path), { data: JSON.parse(this.interpolate(body)) }));
});

When('I send a {word} request to {string} with the raw JSON body {string}', async function (this: PizzaWorld, method: string, path: string, body: string) {
    await store(this, await this.api.send(method, path, { data: body, headers: { 'Content-Type': 'application/json' } }));
});

When('I send a {word} request to {string} with the Authorization header {string}', async function (this: PizzaWorld, method: string, path: string, header: string) {
    const headers: Record<string, string> = header === '[none]' ? {} : { Authorization: this.interpolate(header) };
    await store(this, await this.api.send(method, path, { headers }));
});

When('I create {int} orders in parallel via the API', async function (this: PizzaWorld, count: number) {
    const orders = await Promise.all(
        Array.from({ length: count }, () => this.api.createOrder(uniqueName('Parallel'), SINGLE_ORDER_ITEM)),
    );
    this.orderIds = orders.map(order => order.id);
});

// Response checks

Then('the response status is {int}', async function (this: PizzaWorld, status: number) {
    expect(this.response!.status(), await this.response!.text()).toBe(status);
});

Then('the response status is a client error', async function (this: PizzaWorld) {
    const status = this.response!.status();
    expect(status, `got ${status}: ${await this.response!.text()}`).toBeGreaterThanOrEqual(400);
    expect(status).toBeLessThan(500);
});

Then('the response field {string} is true', async function (this: PizzaWorld, path: string) {
    expect(field(this, path)).toBe(true);
});

Then('the response field {string} is {string}', async function (this: PizzaWorld, path: string, value: string) {
    expect(field(this, path)).toBe(value);
});

Then('the response field {string} contains {string}', async function (this: PizzaWorld, path: string, value: string) {
    expect(field(this, path)).toContain(value);
});

Then('the response field {string} matches {string}', async function (this: PizzaWorld, path: string, pattern: string) {
    expect(field(this, path)).toMatch(new RegExp(pattern));
});

Then('the response field {string} equals:', async function (this: PizzaWorld, path: string, json: string) {
    expect(field(this, path)).toEqual(JSON.parse(json));
});

Then('the response field {string} is present', async function (this: PizzaWorld, path: string) {
    const value = field(this, path);
    expect(value).toBeDefined();
    expect(value).not.toBe('');
});

Then('the response {string} has {int} entries', async function (this: PizzaWorld, path: string, count: number) {
    expect(field(this, path)).toHaveLength(count);
});

Then('every entry in {string} has a non-empty {string}, {string} and {string}', async function (this: PizzaWorld, path: string, key1: string, key2: string, key3: string) {
    for (const entry of field(this, path)) {
        for (const key of [key1, key2, key3]) {
            expect(typeof entry[key]).toBe('string');
            expect(entry[key].trim()).not.toBe('');
        }
    }
});

Then('the response header {string} is {string}', async function (this: PizzaWorld, name: string, value: string) {
    expect(this.response!.headers()[name.toLowerCase()]).toBe(value);
});

Then('the server still answers GET {string} with {int}', async function (this: PizzaWorld, path: string, status: number) {
    expect((await this.api.send('GET', path)).status()).toBe(status);
});

Then('all {int} order IDs are different', async function (this: PizzaWorld, count: number) {
    expect(this.orderIds).toHaveLength(count);
    expect(new Set(this.orderIds).size).toBe(count);
});

// Comparing against the order created at the start of the scenario

Then('the sender and contents of the order are unchanged', async function (this: PizzaWorld) {
    const before = this.requireOrder();
    expect(field(this, 'data.sender')).toBe(before.sender);
    expect(field(this, 'data.contents')).toEqual(before.contents);
});

Then('the contents of the order are unchanged', async function (this: PizzaWorld) {
    expect(field(this, 'data.contents')).toEqual(this.requireOrder().contents);
});

Then('the order is unchanged', async function (this: PizzaWorld) {
    expect(field(this, 'data')).toEqual(this.requireOrder());
});
