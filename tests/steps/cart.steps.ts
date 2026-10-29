import { DataTable, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PizzaWorld } from '../support/world';

When('I increase {string} by {int}', async function (this: PizzaWorld, pizza: string, times: number) {
    await this.home.menu.increase(pizza, times);
});

When('I decrease {string} by {int}', async function (this: PizzaWorld, pizza: string, times: number) {
    await this.home.menu.decrease(pizza, times);
});

When('I increase the pizzas by:', async function (this: PizzaWorld, table: DataTable) {
    for (const { pizza, quantity } of table.hashes()) await this.home.menu.increase(pizza, Number(quantity));
});

When('I click Remove for {string}', async function (this: PizzaWorld, pizza: string) {
    await this.home.cart.remove(pizza);
});

Then('the {string} card shows quantity {int}', async function (this: PizzaWorld, pizza: string, quantity: number) {
    await expect(this.home.menu.quantity(pizza)).toHaveText(String(quantity));
});

Then('the cart line for {string} shows {string}', async function (this: PizzaWorld, pizza: string, text: string) {
    await expect(this.home.cart.lineQuantity(pizza)).toHaveText(text);
});

Then('the total items is {int}', async function (this: PizzaWorld, total: number) {
    await expect(this.home.cart.totalItems).toHaveText(String(total));
});

Then('the empty cart message is not shown', async function (this: PizzaWorld) {
    await expect(this.home.cart.emptyMessage).toBeHidden();
});

Then('the cart shows {string}', async function (this: PizzaWorld, message: string) {
    await expect(this.home.cart.emptyMessage).toHaveText(message);
    await expect(this.home.cart.lines).toHaveCount(0);
});

Then('the cart contains, in this order:', async function (this: PizzaWorld, table: DataTable) {
    const rows = table.hashes();
    await expect(this.home.cart.lineNames()).toHaveText(rows.map(row => row.pizza));
    for (const { pizza, quantity } of rows) {
        await expect(this.home.cart.lineQuantity(pizza)).toHaveText(`Quantity: ${quantity}`);
    }
});

Then('the menu cards show:', async function (this: PizzaWorld, table: DataTable) {
    for (const { pizza, quantity } of table.hashes()) {
        await expect(this.home.menu.quantity(pizza)).toHaveText(quantity);
    }
});

Then('the cart does not contain {string}', async function (this: PizzaWorld, pizza: string) {
    await expect(this.home.cart.line(pizza)).toHaveCount(0);
});
