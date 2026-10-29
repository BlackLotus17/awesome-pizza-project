# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A small Express + vanilla-JS pizza ordering app (the system under test) plus a **Cucumber + Playwright** BDD test suite for it. Most work here is on the tests, not the app.

- `api/server.ts` — Express server on port 3000. Serves `ui/` statically and the REST API (`/api/daily-menu`, `/api/orders`, `/api/orders/:id`, `/api/login`, `/api/protected`, `/api/admin`).
- `api/database.ts` — in-memory menu and seed orders (`order-001`…`order-003`). State resets only on server restart.
- `model/Model.ts` — shared types. Orders use **`sender`** for the customer name (the README's examples say `name`; the README is out of date, and its `npm run dev` / `npm run build` scripts don't exist).
- `ui/` — static pages (`index.html` menu/cart/order management, `login.html`, `protected.html`), no build step.
- `specs/test-plan.md` — the test plan: features, test case IDs (`TC-…`), and known defects D-1…D-7. Feature scenarios are named after these IDs.

## Commands

```bash
npm start                    # run the app (tsx api/server.ts) on http://localhost:3000
npm run test:bdd             # all stable scenarios (excludes @known-defect and @to-confirm)
npm run test:bdd:smoke       # @P1 only
npm run test:bdd:api         # @api only
npm run test:bdd:ui          # @ui only
npm run test:bdd:defects     # only @known-defect / @to-confirm (expected to fail until fixed)
npx cucumber-js --profile all

# Single feature / scenario / tag
npx cucumber-js tests/features/ui/cart.feature
npx cucumber-js tests/features/ui/cart.feature:11
npx cucumber-js --tags @TC-CART-1
```

Environment variables read by the suite:
- `BROWSER=chromium|firefox|webkit` (default chromium) — one browser per run.
- `HEADED=1` — show the browser.
- `BASE_URL`, `SERVER_COMMAND` — override target app / how it's started.
- `UPDATE_SNAPSHOTS=1` — rewrite visual baselines in `tests/__screenshots__/<browser>/<platform>/`.

VS Code's Testing panel runs scenarios through the Cucumber Test Runner extension (`balrog994.cucumber-test-runner`) using the `ide` profile. That profile must not set `paths` (cucumber-js merges them with the file the extension passes, so the whole suite would run) or any stdout formatter (the extension parses `--format message` from stdout).

Reports go to `reports/cucumber-report.{html,json}`. There is no lint or typecheck script.

`playwright.config.ts` is the untouched scaffold and is **not** used by the Cucumber suite; it would only matter for `npx playwright test`.

## Test suite architecture

Config lives in `cucumber.js` (profiles above; TypeScript loaded via `tsx/cjs`).

- `tests/features/{ui,api}/*.feature` — Gherkin. Tags drive selection and hooks: `@ui` / `@api`, priority `@P1`–`@P3`, `@TC-…` IDs, `@known-defect` / `@to-confirm` (assert the *correct* behaviour so they fail until the defect is fixed), `@chromium-only`, `@skip-webkit`.
- `tests/support/hooks.ts` — `BeforeAll` reuses a running app or spawns one (like Playwright's `webServer`) and launches the browser; each scenario gets a fresh `APIRequestContext` + `ApiClient`, and non-`@api` scenarios get a fresh browser context/page. Failure screenshots are attached.
- `tests/support/world.ts` — `PizzaWorld`, per-scenario state (page objects, last API response, created order, captured console errors / failed requests / API requests). `interpolate()` expands `{orderId}`, `{loginToken}`, `{base64:…}` placeholders in feature text.
- `tests/support/api-client.ts` — typed wrapper over the REST API; `mocks.ts` — `page.route` helpers for error paths (500s, aborts, slow responses).
- `tests/pages/` — page objects extending `BasePage` (header, theme toggle, generic role-based controls). `HomePage` composes `MenuSection`, `CartSection`, `OrderManagement`, `Notification`.
- `tests/steps/` — step definitions grouped by area; `common.steps.ts` holds generic ones.
- `tests/data/test-data.ts` — all expected values, credentials, messages and table-cell tokens (`[blank]`, `[whitespace]`, `[N chars]` via `resolveText`); `api-routes.ts` — every API path. Change values here, not in steps.

Conventions from the test plan:
- The server is shared and in-memory and scenarios may run in parallel: each scenario that needs an order **creates its own** (use `uniqueName()`), seeded orders are read-only, and never assert on global order counts.
- Locators: prefer roles/labels; fall back to element IDs only when there's no accessible name; scope menu buttons to their `.menu-item` card.

## TypeScript coding standards

The full list is in the "TypeScript Coding Standards" section of `README.md`. Key rules (there is no linter or formatter, so match the surrounding file):

- 4 spaces, semicolons, single quotes, trailing commas in multi-line literals (tests). Named exports only.
- Imports: external packages first, then relative local modules. Explicit return types on exported functions and methods.
- String-literal unions instead of `enum`; `unknown` for raw input; `any` only for untyped JSON and browser globals.
- `PascalCase` classes and types, `camelCase` members, `UPPER_SNAKE_CASE` constants. Files: `PascalCase.ts` page objects, `<area>.steps.ts` steps, `kebab-case.ts` otherwise.
- Comments: one-line `/** */` on classes and non-obvious methods, `// Section` headers to group code, and comments say *why*.
- Server: `{ success, data?, message?, error? }` envelope, validate and return early, `try/catch` → 500.
- Steps: `async function (this: PizzaWorld, …)`, never arrow functions; keep them thin; use Cucumber expressions, with a regex only for fixed alternatives.
- Page objects: `readonly` locators set in the constructor, methods returning `Locator` for parameterised parts, no assertions.
- Assertions: web-first `expect` in steps, `expect.poll` for values that aren't locators, no unexplained `waitForTimeout`.
- No literals in steps: data goes in `tests/data/test-data.ts`, paths in `API.*`, and scenario state on `PizzaWorld`.

## Playwright agents and skill

`.claude/agents/` has the Playwright test planner / generator / healer agents and `.claude/skills/playwright-cli/` the playwright-cli skill (mirrored in `.github/` for Copilot). Note the generator/healer agents target Playwright Test `.spec.ts` files, whereas this suite is Cucumber — output from them needs adapting to features/steps/page objects.
