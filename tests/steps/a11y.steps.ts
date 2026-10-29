import { DataTable, Then, When } from '@cucumber/cucumber';
import { Locator, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PizzaWorld } from '../support/world';

const MAX_TABS = 60;

async function tabUntilFocused(world: PizzaWorld, target: Locator, description: string): Promise<void> {
    for (let i = 0; i < MAX_TABS; i++) {
        if (await world.home.isFocused(target)) return;
        await world.page.keyboard.press('Tab');
    }
    throw new Error(`Could not reach ${description} with the Tab key`);
}

When('I press Tab until the {string} button of {string} is focused', async function (this: PizzaWorld, button: string, pizza: string) {
    const target = this.home.menu.cardButton(this.home.menu.card(pizza), button);
    await tabUntilFocused(this, target, `"${button}" on ${pizza}`);
});

When('I press Tab until the {string} field is focused', async function (this: PizzaWorld, label: string) {
    await tabUntilFocused(this, this.home.field(label), `the ${label} field`);
});

When('I press Tab until the {string} button is focused', async function (this: PizzaWorld, name: string) {
    await tabUntilFocused(this, this.home.button(name), `the ${name} button`);
});

When('I press {string}', async function (this: PizzaWorld, key: string) {
    await this.page.keyboard.press(key === 'Space' ? ' ' : key);
});

When('I type {string}', async function (this: PizzaWorld, text: string) {
    await this.page.keyboard.type(text);
});

Then('the focused element has a visible focus indicator', async function (this: PizzaWorld) {
    expect(await this.home.focusIndicator()).toEqual({ focusVisible: true, hasIndicator: true });
});

Then('these fields can be found by their label:', async function (this: PizzaWorld, table: DataTable) {
    for (const [label] of table.raw()) await expect(this.home.field(label)).toBeVisible();
});

Then('the theme toggle has the accessible name {string}', async function (this: PizzaWorld, name: string) {
    await expect(this.home.themeToggle).toHaveAccessibleName(name);
});

Then('an axe scan finds no serious or critical violations', async function (this: PizzaWorld) {
    await this.page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page: this.page }).analyze();
    const serious = results.violations
        .filter(v => v.impact === 'serious' || v.impact === 'critical')
        .map(v => `${v.impact}: ${v.id} (${v.nodes.length} nodes) ${v.help}`);
    if (serious.length) this.attach(JSON.stringify(results.violations, null, 2), 'application/json');
    expect(serious).toEqual([]);
});
