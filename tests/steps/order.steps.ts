import { DataTable, Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PizzaWorld } from '../support/world';
import { OrderStatus } from '../support/api-client';
import { failPlaceOrder, failStatusUpdate } from '../support/mocks';
import { DEFAULT_ORDER_ITEMS, SINGLE_ORDER_ITEM, XSS_MARKER, escapeRegExp, resolveText, uniqueName } from '../data/test-data';
import { API, pathOf } from '../data/api-routes';

// Placing an order

When('I enter {string} as my name', async function (this: PizzaWorld, name: string) {
    await this.home.cart.enterName(resolveText(name));
});

Then(/^the Place Order button is (enabled|disabled)$/, async function (this: PizzaWorld, state: string) {
    if (state === 'enabled') await expect(this.home.cart.placeOrderButton).toBeEnabled();
    else await expect(this.home.cart.placeOrderButton).toBeDisabled();
});

When('I place the order', async function (this: PizzaWorld) {
    const [request] = await Promise.all([
        this.page.waitForRequest(req => req.method() === 'POST' && pathOf(req.url()) === API.orders),
        this.home.cart.placeOrder(),
    ]);
    this.orderRequestBody = request.postDataJSON();
    const response = await request.response().catch(() => null);
    if (response?.ok()) this.order = (await response.json()).data;
});

When('I double-click Place Order', async function (this: PizzaWorld) {
    await this.home.cart.placeOrderButton.dblclick();
    await this.page.waitForLoadState('networkidle');
});

Then(/^exactly (\d+) order creation requests? (?:is|are) sent$/, async function (this: PizzaWorld, count: string) {
    expect(this.requestsTo('POST', API.orders)).toHaveLength(Number(count));
});

Then('the order request was sent for {string} with:', async function (this: PizzaWorld, sender: string, table: DataTable) {
    expect(this.orderRequestBody).toEqual({
        sender,
        contents: table.hashes().map(row => ({ name: row.pizza, quantity: Number(row.quantity) })),
    });
});

Then('the name field is empty', async function (this: PizzaWorld) {
    await expect(this.home.cart.nameInput).toHaveValue('');
});

Then('the name field holds {string}', async function (this: PizzaWorld, value: string) {
    await expect(this.home.cart.nameInput).toHaveValue(value);
});

Then('the Order ID field holds the new order ID', async function (this: PizzaWorld) {
    await expect(this.home.orders.orderIdInput).toHaveValue(this.requireOrder().id);
});

Given('the place order API rejects orders with {string}', async function (this: PizzaWorld, message: string) {
    await failPlaceOrder(this.page, 'rejected', message);
});

Given('the place order API is unreachable', async function (this: PizzaWorld) {
    await failPlaceOrder(this.page, 'network error');
});

// Order details

Then('the order details show the new order ID', async function (this: PizzaWorld) {
    await expect(this.home.orders.orderIdValue).toHaveText(this.requireOrder().id);
});

Then('the order details show customer {string} with status {string}', async function (this: PizzaWorld, customer: string, status: string) {
    await expect(this.home.orders.details).toBeVisible();
    await expect(this.home.orders.customerValue).toHaveText(resolveText(customer));
    await expect(this.home.orders.statusBadge).toHaveText(status);
});

Then('the order details list:', async function (this: PizzaWorld, table: DataTable) {
    const rows = table.hashes();
    await expect(this.home.orders.items).toHaveCount(rows.length);
    for (const [i, { pizza, quantity }] of rows.entries()) {
        const item = this.home.orders.items.nth(i);
        await expect(this.home.orders.itemName(item)).toHaveText(pizza);
        await expect(this.home.orders.itemQuantity(item)).toHaveText(`×${quantity}`);
    }
});

Then('the order details include {string} with quantity {int}', async function (this: PizzaWorld, pizza: string, quantity: number) {
    const item = this.home.orders.item(pizza);
    await expect(item).toHaveCount(1);
    await expect(this.home.orders.itemQuantity(item)).toHaveText(`×${quantity}`);
});

Then('the only order actions are:', async function (this: PizzaWorld, table: DataTable) {
    await expect(this.home.orders.actionButtons).toHaveText(table.raw().map(([name]) => name));
});

Then('the order actions are {string}', async function (this: PizzaWorld, actions: string) {
    const expected = actions === 'none' ? [] : actions.split(',').map(a => a.trim());
    await expect(this.home.orders.actionButtons).toHaveText(expected);
});

Then('there are no order actions', async function (this: PizzaWorld) {
    await expect(this.home.orders.actionButtons).toHaveCount(0);
});

Then(/^the order details are (hidden|visible)$/, async function (this: PizzaWorld, state: string) {
    if (state === 'visible') await expect(this.home.orders.details).toBeVisible();
    else await expect(this.home.orders.details).toBeHidden();
});

// Lookup

When('I look up order {string} with the button', async function (this: PizzaWorld, id: string) {
    await this.home.orders.lookUp(resolveText(id), 'button');
});

When('I look up order {string} with Enter', async function (this: PizzaWorld, id: string) {
    await this.home.orders.lookUp(resolveText(id), 'Enter');
});

When('I look up the new order', async function (this: PizzaWorld) {
    await this.home.orders.lookUp(this.requireOrder().id);
    await expect(this.home.orders.orderIdValue).toHaveText(this.requireOrder().id);
});

Then('no order lookup request was sent', async function (this: PizzaWorld) {
    expect(this.requestsTo('GET', API.orderPrefix, 'prefix')).toEqual([]);
});

// Orders created through the API (shared by UI and API scenarios)

Given('I have an order with status {string} created via the API', async function (this: PizzaWorld, status: OrderStatus) {
    const created = await this.api.createOrder(uniqueName('Status'), DEFAULT_ORDER_ITEMS);
    this.order = await this.api.moveToStatus(created.id, status);
});

Given('I have an order for customer {string} created via the API', async function (this: PizzaWorld, sender: string) {
    this.order = await this.api.createOrder(sender, SINGLE_ORDER_ITEM);
});

// Status changes

When('I click the order action {string}', async function (this: PizzaWorld, action: string) {
    const [request] = await Promise.all([
        this.page.waitForRequest(req => req.method() === 'PUT' && pathOf(req.url()).startsWith(API.orderPrefix)),
        this.home.orders.action(action).click(),
    ]);
    this.statusRequestBody = request.postDataJSON();
    await request.response().catch(() => null);
});

Then('a status update request was sent with status {string}', async function (this: PizzaWorld, status: string) {
    expect(this.statusRequestBody).toEqual({ status });
});

Then('the status badge shows {string}', async function (this: PizzaWorld, status: string) {
    await expect(this.home.orders.statusBadge).toHaveText(status);
});

Then('the status badge has the class {string}', async function (this: PizzaWorld, cssClass: string) {
    await expect(this.home.orders.statusBadge).toHaveClass(new RegExp(`\\b${escapeRegExp(cssClass)}\\b`));
});

Given(/^the status update API is (rejecting|unreachable)$/, async function (this: PizzaWorld, mode: string) {
    await failStatusUpdate(this.page, mode === 'rejecting' ? 'rejected' : 'network error');
});

// Security

Then('the order details show customer {string} as plain text', async function (this: PizzaWorld, customer: string) {
    await expect(this.home.orders.customerValue).toHaveText(customer);
    await expect(this.home.orders.customerMarkup()).toHaveCount(0);
});

Then('no injected script has run', async function (this: PizzaWorld) {
    await this.page.waitForTimeout(500); // give an injected onerror handler time to fire
    expect(await this.home.windowValue(XSS_MARKER)).toBeUndefined();
});
