# Awesome Pizza API

A RESTful API for managing daily menu and pizza orders built with Express.js and TypeScript.

## Features

- **Daily Menu API**: Get the current pizza menu
- **Orders API**: Full CRUD operations for pizza orders
- **In-memory Database**: Fast development and testing
- **TypeScript**: Type-safe development
- **CORS Support**: Ready for frontend integration

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm run build` - Build TypeScript to JavaScript

## API Endpoints

Interactive Swagger UI documentation is served at `http://localhost:3000/api-docs.html` while the server is running, and the raw OpenAPI 3.0 spec at `/swagger.json`. Both are static files in `ui/` (Swagger UI loads from a CDN, so it needs an internet connection). To call `/api/protected` or `/api/admin` from Swagger UI, log in with `POST /api/login` (`user` / `pass`), click **Authorize** and paste the token.

A [Bruno](https://www.usebruno.com/) collection in `bruno/` covers every endpoint, including error cases. Open the folder in Bruno, pick the **Local** environment and run the collection, or run it from the command line with `cd bruno && npx @usebruno/cli run --env Local`. Requests reuse the order and token created by earlier ones, so run the whole collection or a whole folder in order rather than single requests.

### Daily Menu

#### GET /api/daily-menu
Returns the current daily pizza menu.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "Margherita Pizza",
      "description": "Classic pizza with fresh tomatoes, mozzarella cheese, and basil",
      "imageUrl": "https://example.com/margherita.jpg"
    }
  ],
  "message": "Daily menu retrieved successfully"
}
```

### Orders

#### GET /api/orders/:id
Get a specific order by ID.

**Parameters:**
- `id` (string) - Order ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order-001",
    "name": "John Doe",
    "status": "RECEIVED",
    "contents": [
      {
        "name": "Margherita Pizza",
        "quantity": 2
      }
    ]
  },
  "message": "Order retrieved successfully"
}
```

#### POST /api/orders
Create a new order.

**Body:**
```json
{
  "name": "Customer Name",
  "contents": [
    {
      "name": "Pizza Name",
      "quantity": 2
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order-1698123456789-123",
    "name": "Customer Name",
    "status": "RECEIVED",
    "contents": [
      {
        "name": "Pizza Name",
        "quantity": 2
      }
    ]
  },
  "message": "Order created successfully"
}
```

#### PUT /api/orders/:id
Update an existing order.

**Parameters:**
- `id` (string) - Order ID

**Body (all fields optional):**
```json
{
  "name": "Updated Customer Name",
  "status": "DELIVERING",
  "contents": [
    {
      "name": "Updated Pizza Name",
      "quantity": 3
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order-001",
    "name": "Updated Customer Name",
    "status": "DELIVERING",
    "contents": [
      {
        "name": "Updated Pizza Name",
        "quantity": 3
      }
    ]
  },
  "message": "Order updated successfully"
}
```

## Data Models

### Menu Entry
```typescript
type menu_entry = {
    name: string,
    description: string,
    imageUrl: string
}
```

### Order
```typescript
type order = {
    id: string,
    name: string,
    status: 'RECEIVED' | 'DELIVERING' | 'DELIVERED' | 'CANCELED'
    contents: {
        name: string,
        quantity: number
    }[]
}
```

## Order Status

Orders have four possible statuses:
- `RECEIVED` - Order has been received and is being prepared
- `DELIVERING` - Order is out for delivery
- `DELIVERED` - Order has been successfully delivered
- `CANCELED` - Order has been canceled

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created (for POST requests)
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

## Development

The API uses an in-memory database for simplicity. Data will be reset when the server restarts. For production use, consider integrating with a persistent database like PostgreSQL or MongoDB.

## Testing the API

You can test the API using tools like:
- Postman
- curl
- Thunder Client (VS Code extension)
- Any HTTP client

Example curl commands:

```bash
# Get daily menu
curl http://localhost:3000/api/daily-menu

# Get order by ID
curl http://localhost:3000/api/orders/order-001

# Create new order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "contents": [
      {"name": "Margherita Pizza", "quantity": 1}
    ]
  }'

# Update order status
curl -X PUT http://localhost:3000/api/orders/order-001 \
  -H "Content-Type: application/json" \
  -d '{"status": "DELIVERING"}'
```
## TypeScript Coding Standards

These describe how the existing `.ts` files are written. No linter or formatter is set up, so follow them by hand and match the file you are editing.

### Formatting

- 4-space indentation, semicolons, single quotes. The double-quoted seed data in `api/database.ts` is older code; use single quotes in new code.
- Use trailing commas in multi-line object, array and argument lists in test code.
- Short single-statement bodies can stay on one line (`if (x) return ...;`, `for (...) await ...;`).

### Modules and types

- Use named exports only, with no default exports (`playwright.config.ts` is the one exception because Playwright requires it).
- Import external packages first (`@cucumber/cucumber`, `@playwright/test`, Node built-ins), then local modules by relative path.
- Give exported functions and class methods explicit return types (`Promise<void>`, `Locator`, `Promise<boolean>`).
- Use string-literal unions for closed sets of values (`OrderStatus`, `mode: 'rejected' | 'network error'`), not `enum`.
- Use `unknown` for deliberately raw input (e.g. `createOrderRaw(body: unknown)`). Keep `any` to untyped JSON and browser globals.
- Shared API types live in `model/Model.ts` for the app and `tests/support/api-client.ts` for the tests.

### Naming

- Classes and types are `PascalCase` (`HomePage`, `PizzaWorld`, `OrderStatus`). The app model types `order` and `menu_entry` predate this, so leave their names as they are.
- Functions, methods, variables and properties are `camelCase`.
- Module-level constants and `static readonly` class constants are `UPPER_SNAKE_CASE` (`BASE_URL`, `PIZZAS`, `MenuSection.INCREASE`).
- Name files as follows: page objects `PascalCase.ts` (`MenuSection.ts`), step files `<area>.steps.ts`, everything else `kebab-case.ts` (`api-client.ts`, `test-data.ts`).

### Comments

- Put a one-line `/** ... */` on each class and on any method whose purpose isn't obvious from its name.
- Group related steps or methods under short `// Section` comments (`// Navigation`, `// Response checks`).
- Comments explain *why* (e.g. a browser quirk or a known defect), not what the next line does.

### API server (`api/`)

- Every response uses the envelope `{ success, data?, message?, error? }`.
- Validate input up front and `return res.status(4xx).json(...)` early. Wrap handler bodies in `try/catch` that returns a 500 envelope.
- Data access goes through the helpers in `api/database.ts` (`findOrderById`, `addOrder`, `updateOrderById`).

### Tests (`tests/`)

- **Step definitions** use `async function (this: PizzaWorld, ...)`, never arrow functions, because Cucumber binds the World to `this`. Keep steps thin and delegate to page objects or `ApiClient`.
- Use Cucumber expressions (`{string}`, `{int}`, `{word}`). Use a regex only for a fixed set of alternatives, e.g. `/^the Place Order button is (enabled|disabled)$/`.
- **Page objects** extend `BasePage` (full pages) or are plain classes (page sections). Declare `readonly` `Locator` fields and assign them in the constructor. Parameterised parts are methods that return a `Locator` (`card(pizza)`), and actions are `async` methods. Page objects never assert.
- **Locators:** use `getByRole` / `getByLabel` first, then element IDs or classes when there is no accessible name. Scope to a parent (e.g. a menu card filtered by its heading).
- **Assertions** live in steps and use Playwright's web-first `expect` (`toHaveText`, `toBeHidden`, `toHaveCount`). Use `expect.poll` for values that aren't locators. Avoid `waitForTimeout`; if one is unavoidable, add a comment saying why.
- **No hard-coded values in steps:** expected text, pizzas, credentials and messages go in `tests/data/test-data.ts`, and API paths go in `tests/data/api-routes.ts` (`API.*`).
- **State** for a scenario lives on `PizzaWorld`, not in module-level variables.
- **Isolation:** create your own orders with `uniqueName()`, treat seeded orders as read-only, and never assert on global order counts.
- **Setup helpers** that fail should throw an `Error` that includes the HTTP status and response body (see `ApiClient.createOrder`).
