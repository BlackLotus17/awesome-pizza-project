---
name: bdd-qa
description: QA standard for the Awesome Pizza repo. Use for any testing work here - exploring the app, writing or fixing Cucumber scenarios, step definitions or page objects, API testing, accessibility/responsive/cross-browser checks, and recording defects or test cases in specs/test-plan.md. Builds on the playwright-cli skill and adapts its Playwright Test output to this Cucumber suite.
allowed-tools: Bash(playwright-cli:*) Bash(npx:*) Bash(npm:*) Bash(curl:*)
---

# QA standard for Awesome Pizza

This suite is **Cucumber + Playwright**, not Playwright Test. Use the `playwright-cli` skill to drive the browser, then turn what you learn into features, steps and page objects as described here. `CLAUDE.md` and the "TypeScript Coding Standards" section of `README.md` are the source of truth for layout and code style; this skill is the workflow.

`playwright-cli` is not installed globally: run it as `npx playwright cli <command>`.

## The QA loop

Every piece of testing work follows the same steps. Do not skip the plan or the run.

1. **Plan** - find the test case in `specs/test-plan.md` (section 4). If it doesn't exist, add a row first: next free `TC-<AREA>-<n>` ID, priority P1-P3, scenario, expected result.
2. **Explore** - reproduce the behaviour by hand with `playwright-cli` against http://localhost:3000 (`npm start` if it isn't running). Capture locators, texts and API traffic.
3. **Automate** - write the scenario, steps and page-object members (see below).
4. **Run** - run the scenario on its own, then its profile, then the full default run. Run UI work on all three browsers before calling it done.
5. **Record** - update the test plan (new IDs, defects, status) in the same change.

## Running the suite

```bash
npm run test:bdd                 # stable scenarios (excludes @known-defect, @to-confirm)
npm run test:bdd:smoke           # @P1
npm run test:bdd:api             # @api
npm run test:bdd:ui              # @ui
npm run test:bdd:defects         # @known-defect / @to-confirm - expected to fail until fixed
npx cucumber-js tests/features/ui/cart.feature:11
npx cucumber-js --tags @TC-CART-1
BROWSER=firefox npm run test:bdd:ui     # also webkit; default chromium
HEADED=1 npx cucumber-js --tags @TC-ORD-2
UPDATE_SNAPSHOTS=1 npx cucumber-js --tags @visual   # only when a visual change is intended
```

Results: `reports/cucumber-report.html` and `.json`. Failure screenshots are attached to the report.

Do **not** use `npx playwright test`, `--debug=cli`, `attach tw-…`, `pause-at` or `step-over` from the playwright-cli references: they only work with Playwright Test, and `playwright.config.ts` / `tests/seed.spec.ts` are unused scaffolding.

## Exploring with playwright-cli

```bash
npx playwright cli open http://localhost:3000
npx playwright cli snapshot
npx playwright cli generate-locator e12 --raw     # role/label locator for a page object
npx playwright cli recording-start                # click through a flow by hand...
npx playwright cli recording-stop                 # ...and get it as Playwright code
npx playwright cli requests                       # API calls the UI made
npx playwright cli request-body 3                 # e.g. check POST /api/orders uses `sender`
npx playwright cli response-body 3                # check the { success, data, message, error } envelope
npx playwright cli console error
npx playwright cli close
```

Useful for specific areas:

| Area | Commands |
|---|---|
| Error paths | `route "**/api/orders" --status=500`, `route … --body='{"success":false,"message":"…"}'`, `network-state-set offline` |
| Theme / a11y | `set-color-scheme dark`, `set-forced-colors active`, `set-contrast more`, `set-reduced-motion reduce`, `press Tab` + `snapshot` for focus order |
| Auth | `localstorage-get auth_token`, `localstorage-set auth_token <token>`, `state-save` / `state-load` |
| Responsive | `resize 375 812`, `resize 768 1024`, `open --device="iPhone 15"` |
| Cross-browser | `open --browser=firefox`, `open --browser=webkit` |
| Evidence | `screenshot --filename=…`, `tracing-start` / `tracing-stop`, `video-start` / `video-stop` |

Keep exploration artefacts (screenshots, traces, snapshots) out of the repo: write them to a scratch directory or `.playwright-cli/`.

## Turning exploration into a scenario

`playwright-cli` prints Playwright code such as `await page.getByRole('button', { name: 'Place Order' }).click();`. Never paste it into a step. Split it up:

| Generated code | Goes into |
|---|---|
| Locator (`getByRole(...)`, `getByLabel(...)`) | a `readonly` field set in the constructor of the page object in `tests/pages/` (or a method returning `Locator` when parameterised, e.g. per pizza). Scope menu buttons to their `.menu-item` card. IDs only when there is no accessible name |
| Action sequence | a page-object method, no assertions |
| Literal values (names, messages, prices, credentials) | `tests/data/test-data.ts` |
| API paths | `API.*` in `tests/data/api-routes.ts` |
| `page.route(...)` | a helper in `tests/support/mocks.ts` |
| `expect(...)` | the `Then` step, web-first (`toHaveText`, `toBeVisible`); `expect.poll` for non-locator values |
| Values carried between steps | a field on `PizzaWorld` |

Scenario rules:

- Name and tag it after the plan: `Scenario: TC-CART-1 Adding one pizza` with `@P1 @TC-CART-1`, inside a feature tagged `@ui` or `@api`.
- Reuse existing steps first: `grep -rn "Given(\|When(\|Then(" tests/steps`. Generic steps go in `common.steps.ts`, the rest in `<area>.steps.ts`.
- Steps are `async function (this: PizzaWorld, …)`, never arrow functions, use Cucumber expressions, and stay thin.
- Data isolation: the server is shared, in-memory and scenarios may run in parallel. Create your own order (`uniqueName()`), treat seed orders `order-001`…`order-003` as read-only, never assert on global order counts.
- Browser-specific behaviour: tag `@chromium-only` or `@skip-webkit` and say why in the plan.
- No `waitForTimeout` without a comment explaining why.

## API testing

- Automated: `@api` features use the per-scenario `ApiClient` (`tests/support/api-client.ts`) - extend it for new endpoints rather than calling `request` in steps. Assert status code, the envelope (`success`, `data`/`message`/`error`) and, for writes, read the resource back.
- Manual: the Bruno collection in `bruno/` (environment `Local`) or `curl`. Swagger UI at http://localhost:3000/api-docs.html.
- When a route or payload changes, update `ui/swagger.json`, `bruno/`, `ApiClient` and `API.*` together.
- Cover per endpoint: happy path, validation (missing/blank/wrong-type fields, unknown menu items, non-integer quantities), not found, auth (missing, malformed, forged token), and illegal state transitions.

## Non-functional checks

- **Accessibility**: `@axe-core/playwright` scans (see `tests/steps/a11y.steps.ts`) with no serious or critical violations on `/`, `/login.html`, `/protected.html`; keyboard reachability and visible focus; contrast in both themes.
- **Responsive**: 375 px and 768 px - no horizontal scroll, no clipped text, the order journey still completes.
- **Cross-browser**: chromium, firefox, webkit via `BROWSER`.
- **Security**: user-supplied text rendered as text (XSS), IDs encoded in URLs, server-side enforcement of anything the UI enforces.
- **Resilience**: 500, `success:false`, abort, slow and offline responses for every API call the UI makes - the UI must show a message and keep the user's input.

## Defects

When behaviour is wrong:

1. Reproduce it twice, with the smallest possible steps (a `curl` command where possible).
2. Add a row to the table in section 2 of `specs/test-plan.md`: next free `D-<n>`, severity (High/Medium/Low, plus "security" where relevant), what is wrong, how it was reproduced. Collect evidence (screenshot, trace, request/response body).
3. Write the scenario asserting the **correct** behaviour and tag it `@known-defect` (confirmed bug) or `@to-confirm` (expected behaviour unclear). Mention the D-number in the scenario. It is excluded from the default run and shows up in `npm run test:bdd:defects`.
4. When fixed: remove the tag, mark the defect **fixed** in the plan, reference the covering TC ID, and check the scenario passes on all three browsers.

Never weaken an assertion to make a failing scenario pass. If the test is wrong, fix the test; if the app is wrong, it is a defect.

## Definition of done

- [ ] Test case exists in `specs/test-plan.md` and the scenario is named and tagged after it.
- [ ] No literals or raw locators in steps; page objects have no assertions.
- [ ] Scenario passes on its own and in `npm run test:bdd`, and UI scenarios pass with `BROWSER=firefox` and `BROWSER=webkit` (or are tagged with the reason).
- [ ] It passes repeatedly (run it at least 3 times) - no flakiness.
- [ ] Defects are recorded in the plan and tagged; nothing is silently skipped.
- [ ] Swagger, Bruno and `CLAUDE.md` are updated if routes, commands or conventions changed.
