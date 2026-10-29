import { IWorldOptions, World, setWorldConstructor } from '@cucumber/cucumber';
import { APIRequestContext, APIResponse, BrowserContext, Page } from '@playwright/test';
import { ApiClient, Order } from './api-client';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { ProtectedPage } from '../pages/ProtectedPage';
import { API, pathOf } from '../data/api-routes';

/** Per-scenario state shared between step definitions. */
export class PizzaWorld extends World {
    // Browser (UI scenarios only)
    context!: BrowserContext;
    page!: Page;
    home!: HomePage;
    loginPage!: LoginPage;
    protectedPage!: ProtectedPage;

    // API
    request!: APIRequestContext;
    api!: ApiClient;
    response?: APIResponse;
    responseJson?: any;
    loginToken?: string;

    // Scenario data
    order?: Order;
    orderIds: string[] = [];
    orderRequestBody?: any;
    statusRequestBody?: any;

    // Things observed in the browser
    consoleErrors: string[] = [];
    failedRequests: string[] = [];
    apiRequests: { method: string; url: string; postData: string | null }[] = [];

    /** API requests the page sent, filtered by method and by exact path or path prefix. */
    requestsTo(method: string, path: string, match: 'exact' | 'prefix' = 'exact') {
        return this.apiRequests.filter(r => r.method === method && (match === 'exact' ? pathOf(r.url) === path : pathOf(r.url).startsWith(path)));
    }

    constructor(options: IWorldOptions) {
        super(options);
    }

    attachPage(context: BrowserContext, page: Page): void {
        this.context = context;
        this.page = page;
        this.home = new HomePage(page);
        this.loginPage = new LoginPage(page);
        this.protectedPage = new ProtectedPage(page);

        page.on('console', msg => {
            if (msg.type() === 'error') this.consoleErrors.push(msg.text());
        });
        page.on('requestfailed', req => this.failedRequests.push(`${req.method()} ${req.url()}`));
        page.on('request', req => {
            if (pathOf(req.url()).startsWith(API.prefix)) {
                this.apiRequests.push({ method: req.method(), url: req.url(), postData: req.postData() });
            }
        });
    }

    /** Replaces placeholders such as {orderId} and {loginToken} in feature text. */
    interpolate(text: string): string {
        return text
            .replace(/\{orderId\}/g, () => this.requireOrder().id)
            .replace(/\{loginToken\}/g, () => this.loginToken ?? '')
            .replace(/\{base64:(.*)\}$/, (_, raw: string) => Buffer.from(raw).toString('base64'));
    }

    requireOrder(): Order {
        if (!this.order) throw new Error('No order in this scenario. Create one first.');
        return this.order;
    }
}

setWorldConstructor(PizzaWorld);
