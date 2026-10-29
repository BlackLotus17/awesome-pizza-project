# Awesome Pizza – Test Plan

**Application URL:** http://localhost:3000
**Date:** 2026-10-29
**Status:** Proposed. No tests written from this plan yet.
**Based on:** source review of `api/`, `ui/`, `model/` plus a live browser walkthrough (Chromium, Playwright 1.64.1).

---

## 1. What the application does

A small Express + vanilla-JS app served from one origin.

| Area | Page / endpoint | Functionality |
|---|---|---|
| Menu | `/` → `GET /api/daily-menu` | 5 pizzas (Margherita, Pepperoni, Quattro Stagioni, Vegetarian Delight, BBQ Chicken), each with image, name, description, `−` / `+` quantity buttons |
| Cart | `/` (client-side only) | Per-item quantities, item list with **Remove**, "Total Items" counter, empty-cart message |
| Place order | `/` → `POST /api/orders` | Requires name (non-whitespace) **and** ≥1 item, otherwise **Place Order** is disabled. On success: notification with order ID, cart + name cleared, order details shown, Order ID field pre-filled |
| Order management | `/` → `GET` / `PUT /api/orders/:id` | Look up by ID (button or Enter). Shows ID, customer, status badge, items. Status actions: RECEIVED → **Mark as Delivering** / **Cancel Order**; DELIVERING → **Mark as Delivered**; DELIVERED / CANCELED → no actions |
| Notifications | all on `/` | Toast with `success` / `error` class, auto-hides after 3 s |
| Theme | all pages | 🌙 / ☀️ toggle, sets `data-theme="dark"` on `<html>`, persisted in `localStorage.theme` |
| Login | `/login.html` → `POST /api/login` | Credentials `user` / `pass` (hint on page). Enter in password submits. Token stored in `localStorage.auth_token`, redirect to `/protected.html`. Already-logged-in users are redirected straight away |
| Protected area | `/protected.html` → `GET /api/protected` | With token: 4 cards (Secret Recipes, Staff Discount, VIP Code, Delivery Note) and **Logout**. Without token: "only visible to logged-in users" message. 401 response clears token and redirects to login |
| Admin API | `GET /api/admin` | No UI. Decodes Bearer token as base64 JSON; `role: "admin"` → 200, other role → 403, missing/invalid → 401 |

**Seed data (in memory, reset only by restarting the server):**
`order-001` John Doe / RECEIVED, `order-002` Jane Smith / DELIVERING, `order-003` Mike Johnson / DELIVERED.

---

## 2. Defects found during exploration

These were reproduced on 2026-10-29. Tests for them should be written to assert the **correct** behaviour and marked `test.fail()` (with a link to the issue) until they are fixed.

| ID | Severity | Defect | How it was reproduced |
|---|---|---|---|
| D-1 | High (security) | `/api/admin` trusts any self-made token: base64 of `{"role":"admin"}` (or with extra fields) is accepted without a signature | `curl /api/admin -H "Authorization: Bearer $(printf '{"role":"admin","forged":1}' \| base64)"` → `Welcome, admin!` |
| D-2 | Medium | Server allows any status transition, e.g. DELIVERED → RECEIVED. The UI enforces the lifecycle, the API does not | `PUT /api/orders/order-003 {"status":"RECEIVED"}` → 200 |
| D-3 | Medium | Server accepts items that are not on the menu and fractional quantities | `POST /api/orders` with `{"name":"Not On Menu","quantity":1.5}` → 201 |
| D-4 | Medium | Protected page logged out shows both "Welcome! You are logged in. Here is the secret staff data." **and** the "only visible to logged-in users" message | Open `/protected.html` with no token |
| D-5 | Low | Theme toggle does nothing on `/protected.html` when logged out (its click listener is only attached after the token check) | Open `/protected.html` logged out, click 🌙 |
| D-6 | High (security), **to confirm** | User-supplied text is rendered with `innerHTML` (customer name in order details, order ID in lookups), so stored XSS is likely | Covered by TC-SEC-1; not yet reproduced |
| D-7 | Low, **to confirm** | Order IDs are put into the URL without `encodeURIComponent`, so IDs containing `/`, `?` or `#` may hit the wrong route | Covered by TC-ORD-LU-6 |

---

## 3. Approach and test infrastructure

**Layers**
- **UI end-to-end** (`page` fixture): user journeys, enabled/disabled states, rendering, persistence.
- **API** (`request` fixture, no browser): validation rules, status codes, response shape. This is quicker and more thorough than going through the UI for edge cases.
- **Mocked-network UI** (`page.route`): error paths the real server can't easily produce (500s, network failure, slow responses).

**Recommended changes before writing tests**
1. `playwright.config.ts`: set `use.baseURL: 'http://localhost:3000'` and enable `webServer` (`npm run start`, `reuseExistingServer: !process.env.CI`) so tests start the app themselves.
2. Add a `setup` project with an authentication spec that logs in as `user` / `pass` and saves `playwright/.auth/user.json`. Logged-in tests depend on it through `storageState`.
3. Split projects: `api` (no browser, runs once), `chromium` / `firefox` / `webkit` for UI, plus `mobile-chrome` (Pixel 7) for the responsive checks only.
4. Create a shared `tests/fixtures.ts` that opens `/` relative to `baseURL` and provides the helper fixtures listed in §5.

**Test data and isolation**
The server keeps all state in memory and tests run in parallel, so:
- Each test that needs an order **creates its own** through `POST /api/orders` (an `apiOrder` fixture) and never changes seeded orders.
- Seeded orders are used **read-only**, for lookup tests only.
- Don't assert on global counts. The order list grows across the run.
- Clear `localStorage` per test (Playwright's default fresh context already does this), except for persistence tests.

**Locators:** prefer roles and labels (`getByRole('button', { name: 'Place Order' })`, `getByLabel('Your Name:')`). Fall back to element IDs (`#total-items`, `#order-details`) where there is no accessible name. Scope menu buttons to their card: `.menu-item` filtered by heading.

**Priorities:** P1 = core journey or security, must pass before release. P2 = important behaviour. P3 = polish and edge cases.

---

## 4. Test cases

### 4.1 Page load and menu (UI)

| ID | P | Scenario | Expected |
|---|---|---|---|
| TC-MENU-1 | P1 | Load `/` | Title "Awesome Pizza - Order Online". Header "🍕 Awesome Pizza", subtitle, theme toggle, "🔒 Login" link. Sections "Today's Menu", "Your Order", "Order Management" visible |
| TC-MENU-2 | P1 | Menu renders from API | Exactly 5 cards in API order, each with the API's name and description, an image with alt = name, quantity 0, and `−` / `+` buttons |
| TC-MENU-3 | P2 | Images load | Every menu `<img>` has `naturalWidth > 0` |
| TC-MENU-4 | P3 | Broken image falls back | Route one image to 404 → `img.src` becomes the inline "Pizza Image" SVG placeholder |
| TC-MENU-5 | P2 | Menu API fails (mocked 500 / `success:false`) | Error toast "Failed to load menu", no cards, page still usable |
| TC-MENU-6 | P2 | Menu API network error (mocked abort) | Error toast "Error loading menu" |
| TC-MENU-7 | P1 | Initial order form state | "Your cart is empty", Total Items 0, **Place Order** disabled, order details hidden |
| TC-MENU-8 | P2 | No unexpected console errors on load | No `console.error` and no failed requests during a normal page load |

### 4.2 Cart (UI)

| ID | P | Scenario | Expected |
|---|---|---|---|
| TC-CART-1 | P1 | `+` on one pizza | Card quantity 1, cart line "Quantity: 1", Total Items 1, empty-cart message gone |
| TC-CART-2 | P1 | `+` on several pizzas, several times | Each card and cart line shows its own quantity. Total = sum. Cart line order = order items were first added |
| TC-CART-3 | P2 | `−` reduces quantity | 3 → 2 updates card, cart line and total |
| TC-CART-4 | P2 | `−` down to 0 | Item disappears from cart. Empty-cart message returns if it was the last item |
| TC-CART-5 | P2 | `−` on a 0-quantity item | Nothing changes: no negative quantity, no cart line |
| TC-CART-6 | P1 | **Remove** button | Item removed whatever its quantity. Card quantity resets to 0. Total updates |
| TC-CART-7 | P3 | Large quantity (e.g. 25 clicks) | Shows 25, total right, layout not broken |
| TC-CART-8 | P3 | Cart is not saved across reloads | Add items, reload → cart empty (documents current behaviour) |

### 4.3 Placing an order (UI)

| ID | P | Scenario | Expected |
|---|---|---|---|
| TC-ORD-1 | P1 | Button enabling rules | Disabled with: nothing; items only; name only; whitespace-only name plus items. Enabled with: name and ≥1 item. Disabled again after removing all items or clearing the name |
| TC-ORD-2 | P1 | Happy path | `POST /api/orders` body = `{sender: trimmed name, contents:[{name, quantity}…]}` → success toast "Order placed successfully! Order ID: order-…". Cart and name cleared, button disabled. Order ID field holds the new ID. Details show that ID, the customer, status RECEIVED, the right items and quantities, and **Mark as Delivering** / **Cancel Order** |
| TC-ORD-3 | P2 | Name is trimmed | "  Ann  " → customer shown as "Ann" |
| TC-ORD-4 | P2 | New order can be looked up | Reload, look up the returned ID → same data |
| TC-ORD-5 | P2 | Server rejects the order (mocked 400 `success:false`) | Toast "Failed to place order: <message>". Cart and name **kept** |
| TC-ORD-6 | P2 | Network failure (mocked abort) | Toast "Error placing order". Cart kept |
| TC-ORD-7 | P3 | Double-click **Place Order** | Documents whether two orders are created (there's no in-flight guard, so likely yes; raise a defect if confirmed) |
| TC-ORD-8 | P3 | Unicode / long name (emoji, accents, 200 characters) | Order created, name shown exactly, layout holds |

### 4.4 Order lookup and status lifecycle (UI)

| ID | P | Scenario | Expected |
|---|---|---|---|
| TC-ORD-LU-1 | P1 | Look up seeded `order-002` with the button | Details: Jane Smith, DELIVERING badge, 2 items, only **Mark as Delivered**. Toast "Order found" |
| TC-ORD-LU-2 | P2 | Look up with Enter | Same as clicking the button |
| TC-ORD-LU-3 | P1 | Unknown ID | Toast "Order not found: Order with ID '<id>' not found". Details hidden, including when a previous order was showing |
| TC-ORD-LU-4 | P2 | Empty or whitespace ID | Toast "Please enter an order ID". No request sent |
| TC-ORD-LU-5 | P3 | ID with spaces around it | Trimmed before lookup and found |
| TC-ORD-LU-6 | P3 | ID containing `/`, `?`, `#` (D-7) | Clean "not found" message, no wrong route or JSON error |
| TC-ORD-LU-7 | P1 | RECEIVED → DELIVERING → DELIVERED (own order) | Each click sends `PUT {status}`, the badge updates, toast "Order status updated to …". Buttons change as in §1. DELIVERED has no buttons |
| TC-ORD-LU-8 | P1 | RECEIVED → CANCELED | Badge CANCELED, no buttons |
| TC-ORD-LU-9 | P2 | Status survives a reload | Look the order up again after a reload → same status |
| TC-ORD-LU-10 | P2 | Status badge styling | Badge has class `status-received` / `-delivering` / `-delivered` / `-canceled` |
| TC-ORD-LU-11 | P2 | Status update fails (mocked 400 / abort) | Error toast, badge unchanged |
| TC-ORD-LU-12 | P3 | Read-only lookups of seeded `order-001` and `order-003` | Right data and buttons for RECEIVED / DELIVERED (don't click the actions) |

### 4.5 Notifications (UI)

| ID | P | Scenario | Expected |
|---|---|---|---|
| TC-NOTE-1 | P2 | Success vs error styling | Has `success` or `error` class to match. Visible (`show`) |
| TC-NOTE-2 | P3 | Auto-hide | `show` class removed after ~3 s. Use `page.clock` instead of real waiting |

### 4.6 Theme (UI)

| ID | P | Scenario | Expected |
|---|---|---|---|
| TC-THEME-1 | P2 | Toggle on `/` | `data-theme="dark"` on `<html>`, icon ☀️, `localStorage.theme = "dark"`. Toggle again → attribute removed, 🌙, `"light"` |
| TC-THEME-2 | P2 | Persists across reload | Dark stays dark after reload |
| TC-THEME-3 | P3 | Shared across pages | Dark on `/` → `/login.html` and `/protected.html` load dark |
| TC-THEME-4 | P3 | Toggle on login page and on protected page when logged in | Works as in TC-THEME-1 |
| TC-THEME-5 | P3 | Toggle on protected page **logged out** (D-5) | Should toggle. `test.fail()` until fixed |
| TC-THEME-6 | P3 | Dark-mode visual snapshot | `toHaveScreenshot` of `/` in light and dark (Chromium only, menu images masked) |

### 4.7 Login and protected area (UI)

| ID | P | Scenario | Expected |
|---|---|---|---|
| TC-AUTH-1 | P1 | "🔒 Login" link on `/` | Goes to `/login.html` (title "Awesome Pizza - Login", hint "user / pass") |
| TC-AUTH-2 | P1 | Valid login (button) | `auth_token` saved, redirected to `/protected.html`, 4 cards show the API data, **Logout** visible |
| TC-AUTH-3 | P2 | Valid login with Enter in password | Same as TC-AUTH-2 |
| TC-AUTH-4 | P1 | Wrong password / unknown user / empty fields | "Invalid username or password" shown, stays on login, no token |
| TC-AUTH-5 | P3 | Username is trimmed, password is not | `"  user  "` / `pass` succeeds. `user` / `" pass"` fails |
| TC-AUTH-6 | P3 | Error message clears on retry | Error hidden when a new attempt starts |
| TC-AUTH-7 | P2 | Login API unreachable (mocked abort) | "Login failed — server unreachable" |
| TC-AUTH-8 | P2 | Already logged in, open `/login.html` | Redirected immediately to `/protected.html` (uses storageState) |
| TC-AUTH-9 | P1 | Logout | Token removed, redirected to `/login.html`. Going back to `/protected.html` shows the logged-out view |
| TC-AUTH-10 | P1 | Open `/protected.html` logged out | Login-required message with a link to `login.html`. No secret data, no Logout. Assert that **no** "Welcome! You are logged in" text appears (D-4, `test.fail()` until fixed) |
| TC-AUTH-11 | P1 | Invalid or expired token in storage | `GET /api/protected` returns 401 → token cleared, redirected to login |
| TC-AUTH-12 | P2 | Protected API returns 500 or fails (mocked) | "Failed to load protected data." |

### 4.8 API: menu and orders (`request` fixture)

| ID | P | Scenario | Expected |
|---|---|---|---|
| TC-API-1 | P1 | `GET /api/daily-menu` | 200, `success:true`, `data` has 5 entries with non-empty `name` / `description` / `imageUrl`, message "Daily menu retrieved successfully" |
| TC-API-2 | P1 | `GET /api/orders/order-001` | 200, matches the seed data |
| TC-API-3 | P1 | `GET /api/orders/<unknown>` | 404, `error:"Not found"`, message contains the ID |
| TC-API-4 | P1 | `POST /api/orders` valid | 201. `id` matches `^order-\d+-\d+$`. `status` RECEIVED. `sender` trimmed. `contents` echoed back |
| TC-API-5 | P1 | `POST` validation (data-driven) | 400 with the documented message for each of: missing / empty / whitespace / non-string `sender`; missing / non-array / empty `contents`; item with missing / empty / non-string `name`; `quantity` missing / 0 / negative / string |
| TC-API-6 | P2 | `POST` with a non-JSON body | Handled with a 4xx, not a crash. Server still responds afterwards |
| TC-API-7 | P2 | Generated IDs are unique | 20 parallel `POST`s → 20 different IDs |
| TC-API-8 | P1 | `PUT` each valid status | 200, `status` updated, other fields unchanged |
| TC-API-9 | P1 | `PUT` validation | Bad status (`"SHIPPED"`, lowercase `"delivered"`) → 400 listing valid statuses. Empty `sender`, empty or invalid `contents` → 400. Unknown ID → 404 |
| TC-API-10 | P2 | `PUT` partial update | Only `sender` → sender changes, status and contents kept. Empty body `{}` → 200, nothing changes |
| TC-API-11 | P2 | `PUT` updates `contents` | New items replace the old ones |
| TC-API-12 | P2 | Lifecycle enforced server-side (D-2) | DELIVERED → RECEIVED and CANCELED → DELIVERING should be rejected. `test.fail()` until fixed |
| TC-API-13 | P2 | Menu-only items and whole-number quantities (D-3) | Unknown pizza name or `quantity:1.5` should give 400. `test.fail()` until fixed |
| TC-API-14 | P3 | CORS | Response headers include `Access-Control-Allow-Origin: *`. `OPTIONS /api/orders` → 200 |

### 4.9 API: auth

| ID | P | Scenario | Expected |
|---|---|---|---|
| TC-API-AUTH-1 | P1 | `POST /api/login` valid | 200, `success:true`, `token` present |
| TC-API-AUTH-2 | P1 | `POST /api/login` invalid / missing fields | 401, `error:"Invalid credentials"` |
| TC-API-AUTH-3 | P1 | `GET /api/protected` | No header / no `Bearer ` prefix / wrong token → 401 `Valid token required`. Valid token → 200 with `secretRecipes` (3), `staffDiscount`, `vipCode`, `deliveryNote` |
| TC-API-AUTH-4 | P2 | `GET /api/admin` | No token → 401 `Token required`. Non-base64-JSON → 401 `Invalid token format`. `{"role":"user"}` → 403. Login token → 200 `Welcome, admin!` |
| TC-API-AUTH-5 | P1 | Forged admin token (D-1) | A token the client built itself should be rejected. `test.fail()` until fixed |

### 4.10 Security (UI)

| ID | P | Scenario | Expected |
|---|---|---|---|
| TC-SEC-1 | P1 | Stored XSS through customer name (D-6) | Create an order through the API with sender `<img src=x onerror="window.__xss=1">`, look it up in the UI → the text is shown literally and `window.__xss` is undefined |
| TC-SEC-2 | P2 | XSS through order ID lookup | Look up `<img src=x onerror=…>` → no script runs (the not-found message uses `textContent`, but check it) |
| TC-SEC-3 | P3 | Login password field | `type="password"`. Credentials sent in the POST body, not the URL |

### 4.11 Responsive and accessibility

| ID | P | Scenario | Expected |
|---|---|---|---|
| TC-RWD-1 | P2 | 375 px wide (mobile project) | No horizontal scroll. Menu cards stack. Full order journey (TC-ORD-2) can be completed |
| TC-RWD-2 | P3 | Tablet 768 px | Menu grid wraps with no clipped text |
| TC-A11Y-1 | P2 | Keyboard-only order journey | Tab to `+`, the name field and Place Order, and use Enter / Space to finish an order. Focus is visible |
| TC-A11Y-2 | P2 | Labels | Name, Order ID, username and password inputs are reachable with `getByLabel`. Theme toggle has an accessible name |
| TC-A11Y-3 | P3 | Automated scan | `@axe-core/playwright` on `/`, `/login.html`, `/protected.html`, with no serious or critical violations (needs a new dev dependency) |

---

## 5. Suggested folder layout (when tests are written)

```
tests/
  fixtures.ts               # page → '/', apiOrder fixture, loggedIn fixture
  auth.setup.ts             # logs in, saves storageState ('setup' project)
  ui/menu.spec.ts           # 4.1
  ui/cart.spec.ts           # 4.2
  ui/place-order.spec.ts    # 4.3
  ui/order-management.spec.ts # 4.4, 4.5
  ui/theme.spec.ts          # 4.6
  ui/auth.spec.ts           # 4.7
  ui/security.spec.ts       # 4.10
  ui/responsive-a11y.spec.ts  # 4.11
  api/menu-orders.spec.ts   # 4.8
  api/auth.spec.ts          # 4.9
```

## 6. Suggested implementation order

1. Infrastructure changes (§3), then the P1 API tests (4.8 / 4.9): quick and stable.
2. P1 UI journeys: TC-MENU-1/2/7, TC-CART-1/2/6, TC-ORD-1/2, TC-ORD-LU-1/3/7/8, TC-AUTH-1/2/4/9/10/11.
3. Security: TC-SEC-1, TC-API-AUTH-5.
4. P2 cases, then P3, then cross-browser and mobile runs in CI (`.github/workflows`).

**Size:** 83 test cases (30 P1, 34 P2, 19 P3). Several API validation cases are data-driven loops inside one test file.
