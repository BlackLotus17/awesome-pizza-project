import { After, AfterAll, Before, BeforeAll, ITestCaseHookParameter, Status, setDefaultTimeout } from '@cucumber/cucumber';
import { Browser, BrowserType, chromium, firefox, request, webkit } from '@playwright/test';
import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import { ApiClient } from './api-client';
import { PizzaWorld } from './world';
import { BASE_URL, SERVER_COMMAND } from '../data/test-data';
import { API } from '../data/api-routes';

setDefaultTimeout(30_000);

const BROWSERS: Record<string, BrowserType> = { chromium, firefox, webkit };
export const browserName = process.env.BROWSER ?? 'chromium';

let browser: Browser | undefined;
let server: ChildProcess | undefined;

async function serverIsUp(): Promise<boolean> {
    try {
        return (await fetch(`${BASE_URL}${API.menu}`)).ok;
    } catch {
        return false;
    }
}

// Same idea as Playwright's webServer: reuse a running app, otherwise start one.
BeforeAll({ timeout: 60_000 }, async function () {
    if (!(await serverIsUp())) {
        server = spawn(SERVER_COMMAND[0], SERVER_COMMAND.slice(1), {
            cwd: path.resolve(__dirname, '../..'),
            stdio: 'ignore',
            detached: process.platform !== 'win32',
        });
        const deadline = Date.now() + 30_000;
        while (!(await serverIsUp())) {
            if (Date.now() > deadline) throw new Error(`App did not start on ${BASE_URL}`);
            await new Promise(resolve => setTimeout(resolve, 250));
        }
    }
    const browserType = BROWSERS[browserName];
    if (!browserType) throw new Error(`Unknown BROWSER "${browserName}". Use chromium, firefox or webkit.`);
    browser = await browserType.launch({ headless: !process.env.HEADED });
});

AfterAll(async function () {
    await browser?.close();
    if (server?.pid) {
        // Kill the whole process group (npx → tsx → node)
        try {
            process.kill(-server.pid);
        } catch {
            server.kill();
        }
    }
});

Before({ tags: '@chromium-only' }, function () {
    if (browserName !== 'chromium') return 'skipped';
});

// WebKit on macOS does not move Tab focus to buttons and links (same as Safari's default)
Before({ tags: '@skip-webkit' }, function () {
    if (browserName === 'webkit') return 'skipped';
});

Before(async function (this: PizzaWorld) {
    this.request = await request.newContext({ baseURL: BASE_URL });
    this.api = new ApiClient(this.request);
});

Before({ tags: 'not @api' }, async function (this: PizzaWorld) {
    const context = await browser!.newContext({ baseURL: BASE_URL });
    this.attachPage(context, await context.newPage());
});

After(async function (this: PizzaWorld, { result }: ITestCaseHookParameter) {
    if (this.page && result?.status === Status.FAILED) {
        const screenshot = await this.page.screenshot({ fullPage: true }).catch(() => undefined);
        if (screenshot) this.attach(screenshot, 'image/png');
    }
    await this.context?.close();
    await this.request?.dispose();
});
