import { Locator, Page } from '@playwright/test';

/** "Today's Menu": one card per pizza with − / + quantity buttons. */
export class MenuSection {
    readonly cards: Locator;
    readonly names: Locator;
    readonly images: Locator;
    readonly cardTexts: Locator;

    static readonly INCREASE = '+';
    static readonly DECREASE = '−';

    constructor(private readonly page: Page) {
        this.cards = page.locator('#menu-container .menu-item');
        this.names = this.cards.getByRole('heading', { level: 3 });
        this.images = this.cards.locator('img');
        this.cardTexts = this.cards.locator('h3, p');
    }

    // Parts of a given card (by index or as a Locator)

    name(card: Locator): Locator {
        return card.getByRole('heading', { level: 3 });
    }

    description(card: Locator): Locator {
        return card.locator('p');
    }

    cardImage(card: Locator): Locator {
        return card.locator('img');
    }

    cardQuantity(card: Locator): Locator {
        return card.locator('.quantity-display');
    }

    cardButton(card: Locator, symbol: string): Locator {
        return card.getByRole('button', { name: symbol, exact: true });
    }

    // Parts of a card found by pizza name

    card(pizza: string): Locator {
        return this.cards.filter({ has: this.page.getByRole('heading', { name: pizza, exact: true }) });
    }

    image(pizza: string): Locator {
        return this.cardImage(this.card(pizza));
    }

    quantity(pizza: string): Locator {
        return this.cardQuantity(this.card(pizza));
    }

    increaseButton(pizza: string): Locator {
        return this.cardButton(this.card(pizza), MenuSection.INCREASE);
    }

    decreaseButton(pizza: string): Locator {
        return this.cardButton(this.card(pizza), MenuSection.DECREASE);
    }

    async increase(pizza: string, times = 1): Promise<void> {
        for (let i = 0; i < times; i++) await this.increaseButton(pizza).click();
    }

    async decrease(pizza: string, times = 1): Promise<void> {
        for (let i = 0; i < times; i++) await this.decreaseButton(pizza).click();
    }

    // Layout and loading state

    allImagesLoaded(): Promise<boolean> {
        return this.images.evaluateAll(imgs => (imgs as HTMLImageElement[]).every(img => img.complete && img.naturalWidth > 0));
    }

    allImagesSettled(): Promise<boolean> {
        return this.images.evaluateAll(imgs => (imgs as HTMLImageElement[]).every(img => img.complete));
    }

    /** Distinct top positions of the cards, i.e. how many grid rows there are. */
    async rowCount(): Promise<number> {
        const tops = await this.cards.evaluateAll(cards => cards.map(card => Math.round(card.getBoundingClientRect().top)));
        return new Set(tops).size;
    }

    /** Text of any card heading or description that is wider than its box. */
    clippedTexts(): Promise<(string | null)[]> {
        return this.cardTexts.evaluateAll(els => els.filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.textContent));
    }
}
