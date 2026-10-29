import { DataTable, Given, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PizzaWorld } from '../support/world';
import { failImage, failMenu } from '../support/mocks';
import { PLACEHOLDER_IMAGE_PREFIX, SEED_ORDERS, escapeRegExp, uniqueName } from '../data/test-data';

Then('the header shows {string} with subtitle {string}', async function (this: PizzaWorld, title: string, subtitle: string) {
    await expect(this.home.heading).toHaveText(title);
    await expect(this.home.subtitle).toHaveText(subtitle);
});

Then('the theme toggle is visible', async function (this: PizzaWorld) {
    await expect(this.home.themeToggle).toBeVisible();
});

Then('the {string} link is visible', async function (this: PizzaWorld, name: string) {
    await expect(this.home.link(name)).toBeVisible();
});

Then('these sections are visible:', async function (this: PizzaWorld, table: DataTable) {
    for (const [name] of table.raw()) await expect(this.home.sectionHeading(name)).toBeVisible();
});

Then('the menu shows exactly these pizzas in this order:', async function (this: PizzaWorld, table: DataTable) {
    await expect(this.home.menu.names).toHaveText(table.raw().map(([name]) => name));
});

Then('every menu card shows the name and description from the daily menu API', async function (this: PizzaWorld) {
    const menu: { name: string; description: string }[] = (await (await this.api.getMenu()).json()).data;
    await expect(this.home.menu.cards).toHaveCount(menu.length);
    for (const [i, item] of menu.entries()) {
        const card = this.home.menu.cards.nth(i);
        await expect(this.home.menu.name(card)).toHaveText(item.name);
        await expect(this.home.menu.description(card)).toHaveText(item.description);
    }
});

Then('every menu image has the pizza name as its alt text', async function (this: PizzaWorld) {
    for (const card of await this.home.menu.cards.all()) {
        const name = (await this.home.menu.name(card).textContent())!.trim();
        await expect(this.home.menu.cardImage(card)).toHaveAttribute('alt', name);
    }
});

Then('every menu card shows quantity 0 with {string} and {string} buttons', async function (this: PizzaWorld, minus: string, plus: string) {
    for (const card of await this.home.menu.cards.all()) {
        await expect(this.home.menu.cardQuantity(card)).toHaveText('0');
        await expect(this.home.menu.cardButton(card, minus)).toBeVisible();
        await expect(this.home.menu.cardButton(card, plus)).toBeVisible();
    }
});

Then('every menu image has loaded', async function (this: PizzaWorld) {
    await expect.poll(() => this.home.menu.allImagesLoaded()).toBe(true);
});

Given('the menu image {string} is missing', async function (this: PizzaWorld, imagePath: string) {
    await failImage(this.page, imagePath);
});

Then('the {string} image shows the placeholder image', async function (this: PizzaWorld, pizza: string) {
    await expect(this.home.menu.image(pizza)).toHaveAttribute('src', new RegExp(`^${escapeRegExp(PLACEHOLDER_IMAGE_PREFIX)}`));
});

Given(/^the daily menu API returns (server error|success false|network error)$/, async function (this: PizzaWorld, mode: 'server error' | 'success false' | 'network error') {
    await failMenu(this.page, mode);
});

Then('no menu cards are shown', async function (this: PizzaWorld) {
    await expect(this.home.menu.cards).toHaveCount(0);
});

Then('the page is still usable', async function (this: PizzaWorld) {
    const name = uniqueName('Still Usable');
    await this.home.cart.enterName(name);
    await expect(this.home.cart.nameInput).toHaveValue(name);
    await this.home.orders.lookUp(SEED_ORDERS.delivering.id);
    await expect(this.home.orders.customerValue).toHaveText(SEED_ORDERS.delivering.sender);
});

Then('the menu cards are stacked in one column', async function (this: PizzaWorld) {
    const boxes = await Promise.all((await this.home.menu.cards.all()).map(card => card.boundingBox()));
    for (let i = 1; i < boxes.length; i++) {
        expect(Math.abs(boxes[i]!.x - boxes[0]!.x)).toBeLessThanOrEqual(1);
        expect(boxes[i]!.y).toBeGreaterThan(boxes[i - 1]!.y);
    }
});

Then('the menu grid wraps onto more than one row', async function (this: PizzaWorld) {
    expect(await this.home.menu.rowCount()).toBeGreaterThan(1);
});

Then('no menu card text is clipped', async function (this: PizzaWorld) {
    expect(await this.home.menu.clippedTexts()).toEqual([]);
});
