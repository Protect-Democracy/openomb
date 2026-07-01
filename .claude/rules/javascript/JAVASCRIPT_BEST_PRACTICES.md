---
description: JavaScript best practices for naming, functions, async, error handling, and JSDoc — applies to all JS/TS code.
paths:
  - '**/*.js'
  - '**/*.jsx'
  - '**/*.ts'
  - '**/*.tsx'
  - '**/*.svelte'
  - '**/*.js*.jinja'
  - '**/*.jsx*.jinja'
  - '**/*.ts*.jinja'
  - '**/*.tsx*.jinja'
  - '**/*.svelte*.jinja'
---

# JavaScript Core Patterns

Comprehensive JavaScript best practices based on the Google Style Guide, Airbnb Style Guide, MDN, and modern community standards. These apply to all JavaScript and TypeScript code.

Borrowed from: [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html), [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript), [TypeScript Style Guide (mkosir)](https://mkosir.github.io/typescript-style-guide/), [andredesousa/typescript-best-practices](https://github.com/andredesousa/typescript-best-practices)

---

## Documentation with JSDoc

Use JSDoc for all exported functions, classes, and non-obvious code. When using TypeScript, omit type annotations from JSDoc — TypeScript handles types, JSDoc handles intent.

### Functions

```javascript
/**
 * Fetch users matching the given filters.
 *
 * Retrieves users from the database that match all provided
 * filter criteria. Results are ordered by creation date.
 *
 * @param filters - Key-value pairs for filtering (e.g., `{ role: "admin" }`).
 * @param limit - Maximum number of users to return.
 * @param includeInactive - Whether to include deactivated accounts.
 * @returns List of users matching the criteria, ordered by creation date
 *   descending. Empty array if no matches.
 * @throws {DatabaseError} If the database connection fails.
 * @throws {ValueError} If filters contains invalid keys.
 *
 * @example
 * const users = await fetchUsers({ department: "engineering" }, 10);
 * console.log(users.length); // 10
 */
async function fetchUsers(filters, limit = 100, includeInactive = false) {
  // ...
}
```

### Do Not Duplicate Types in JSDoc

```typescript
// BAD: Redundant type annotations when using TypeScript
/**
 * @param {string} name - The user's name.
 * @param {number} age - The user's age.
 * @returns {boolean} Whether the user is valid.
 */
function isValidUser(name: string, age: number): boolean { ... }

// GOOD: Describe purpose, not types — TypeScript already knows
/**
 * Check whether a user meets the minimum registration requirements.
 *
 * @param name - Display name (checked for length and prohibited characters).
 * @param age - Must be at least 13 to comply with COPPA.
 */
function isValidUser(name: string, age: number): boolean { ... }
```

### Modules and Classes

```javascript
/**
 * User management utilities.
 *
 * Provides functions for user CRUD operations
 * and authentication helpers.
 * @module
 */

/**
 * Service for user-related business logic.
 *
 * Handles user creation, updates, and authentication.
 * All methods are transaction-safe.
 */
class UserService {
  // ...
}
```

---

## Error Handling

### Only Throw `Error` Instances

```javascript
// BAD: No stack trace, poor debugging
throw 'Something went wrong';
throw 404;

// GOOD: Proper Error with stack trace
throw new Error('Something went wrong');

// GOOD: Custom error types
class NotFoundError extends Error {
  constructor(resource, id) {
    super(`${resource} not found: ${id}`);
    this.name = 'NotFoundError';
  }
}
```

### Document Empty Catch Blocks

```javascript
try {
  await optionalCleanup();
} catch {
  // Intentionally ignored — cleanup failure is non-critical
}
```

### Chain Errors with `cause`

When re-throwing, preserve the original error with the `cause` option (ES2022).

```javascript
// BAD: Original error and stack trace are lost
try {
  await fetchData();
} catch (err) {
  throw new Error('Failed to load data');
}

// GOOD: Chain the original cause
try {
  await fetchData();
} catch (err) {
  throw new Error('Failed to load data', { cause: err });
}
```

---

## Modules & Imports

### Named Exports Only

```javascript
// BAD: Default exports create ambiguous import names
export default class UserService { ... }

// GOOD: Named exports are explicit and refactor-safe
export class UserService { ... }
export function createUser(data) { ... }
```

### No `require()`

```javascript
// BAD: Legacy CommonJS
const fs = require('fs');

// GOOD: ES modules
import * as fs from 'fs';
```

### Namespace Imports for Large APIs

```javascript
// Many symbols from one module — use namespace import
import * as path from 'path';
path.join(dir, file);
path.resolve(base, relative);

// Few symbols — use named imports
import { readFile, writeFile } from 'fs/promises';
```

### Remove Unused Imports

Configure your linter to enforce this. Dead imports add confusion and slow down tooling.

---

## Naming Conventions

| Style           | Used For                                              |
| --------------- | ----------------------------------------------------- |
| `PascalCase`    | Classes, enums, components, type parameters           |
| `camelCase`     | Variables, parameters, functions, methods, properties |
| `CONSTANT_CASE` | Global constants, enum values, static readonly        |

### Naming Guidelines

```javascript
// Booleans: is, has, should, can prefixes
const isActive = true;
const hasPermission = checkAccess(user);
const canEdit = user.role === "admin";
const shouldRetry = attempts < maxRetries;

// Treat acronyms as words
function loadHttpUrl(endpoint) { ... }  // Not loadHTTPURL
class JsonParser { ... }                // Not JSONParser
const apiUrl = "/users";                // Not apiURL

// Descriptive names — no abbreviations
// BAD: const usr = getUsr(id);
// GOOD:
const user = getUser(id);

// Collections: plural nouns
const users = [];
const permissions = new Set();

// Callbacks: on* prefix; handlers: handle* prefix
function handleClick(event) { ... }
```

---

## Variables & Scoping

### `const` by Default

Use `const` for all declarations. Only use `let` when reassignment is necessary.

```javascript
// BAD: let when value never changes
let name = 'Alice';
let items = getItems();

// GOOD: const by default
const name = 'Alice';
const items = getItems();

// GOOD: let only when reassignment is needed
let count = 0;
for (const item of items) {
  count += item.quantity;
}
```

### One Declaration per Statement

```javascript
// BAD: Comma-separated declarations
const items = getItems(),
  goSportsTeam = true,
  dragonball = 'z';

// GOOD: One per line — easier to diff and debug
const items = getItems();
const goSportsTeam = true;
const dragonball = 'z';
```

### Declare Variables Near Use

```javascript
// BAD: Declared before needed — wasted work on early return
function checkName(hasName) {
  const name = getName();
  if (hasName === 'test') return false;
  // ...uses name
}

// GOOD: Defer past early returns
function checkName(hasName) {
  if (hasName === 'test') return false;
  const name = getName();
  // ...uses name
}
```

---

## Destructuring & Spread

### Object & Array Destructuring

```javascript
// BAD: Repeated property access
function getFullName(user) {
  const firstName = user.firstName;
  const lastName = user.lastName;
  return `${firstName} ${lastName}`;
}

// GOOD: Destructure
function getFullName({ firstName, lastName }) {
  return `${firstName} ${lastName}`;
}
```

### Prefer Object Returns Over Array Returns

```javascript
// BAD: Callers must know positional order
function processInput(input) {
  return [left, right, top, bottom];
}
const [left, , top] = processInput(input);

// GOOD: Callers pick what they need by name
function processInput(input) {
  return { left, right, top, bottom };
}
const { left, top } = processInput(input);
```

### Rest Parameters Over `arguments`

```javascript
// BAD: arguments is not a real Array
function concatenateAll() {
  const args = Array.prototype.slice.call(arguments);
  return args.join('');
}

// GOOD: Rest params are a real Array
function concatenateAll(...args) {
  return args.join('');
}
```

### Spread Over `.apply()`

```javascript
// BAD
console.log.apply(console, [1, 2, 3]);

// GOOD
console.log(...[1, 2, 3]);
```

---

## Modern Syntax

### Template Literals

```javascript
// BAD: String concatenation
const greeting = 'Hello, ' + name + '! You are ' + age + ' years old.';

// GOOD: Template literal
const greeting = `Hello, ${name}! You are ${age} years old.`;

// BAD: Template literal without interpolation
const plain = `no interpolation here`;

// GOOD: Regular string when no interpolation needed
const plain = 'no interpolation here';
```

### Optional Chaining & Nullish Coalescing

```javascript
// BAD: || treats 0, "", and false as missing
const port = config.port || 3000;      // 0 becomes 3000
const name = config.name || "default"; // "" becomes "default"

// GOOD: ?? only triggers on null/undefined
const port = config.port ?? 3000;
const name = config.name ?? "default";

// GOOD: Combine ?. and ?? for safe deep access
const city = user?.address?.city ?? "Unknown";

// BAD: Mixing ?? with || without parentheses (SyntaxError)
const x = a || b ?? c;

// GOOD: Parentheses required
const x = (a || b) ?? c;
```

### Explicit Type Coercion

```javascript
// BAD: Wrapper constructors create objects, not primitives
const score = new String(reviewScore);

// BAD: Cryptic coercion
const val = +inputValue;

// GOOD: Explicit casting functions
const score = String(reviewScore);
const val = Number(inputValue);
const isValid = Boolean(value);

// GOOD: Always pass radix to parseInt
const port = parseInt(inputValue, 10);
```

### `Object.hasOwn()` Over `hasOwnProperty`

```javascript
// BAD: Unsafe for Object.create(null) objects
console.log(obj.hasOwnProperty(key));

// GOOD
console.log(Object.hasOwn(obj, key));
```

---

## Functions & Classes

### Function Declarations vs Arrow Functions

```javascript
// Named top-level functions: use declarations
function calculateTotal(items, taxRate = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  return subtotal * (1 + taxRate);
}

// Callbacks and inline: use arrow functions
const activeUsers = users.filter((user) => user.isActive);
const names = users.map((user) => user.name);
```

### Parameter Design

```javascript
// 1-2 params: positional is fine
function getUser(id) { ... }

// Many params: use an options object
function fetchData({ url, method = "GET", headers = {}, timeout = 5000 }) {
  // ...
}
```

### Early Returns

```javascript
// GOOD: Reduce nesting with early returns
function getDiscount(user) {
  if (!user.isActive) {
    return 0;
  }
  if (user.tier === 'premium') {
    return 0.2;
  }
  if (user.orders > 100) {
    return 0.1;
  }
  return 0.05;
}
```

### Prefer Pure Functions

```javascript
// BAD: Mutates input
function addTag(user, tag) {
  user.tags.push(tag);
}

// GOOD: Returns new data
function addTag(user, tag) {
  return { ...user, tags: [...user.tags, tag] };
}
```

### Never Mutate or Reassign Parameters

```javascript
// BAD: Mutates the caller's data
function process(items) {
  items.sort();
}

// BAD: Reassigning params is confusing
function discount(price) {
  price = price * 0.9;
  return price;
}

// GOOD: Derive new values
function process(items) {
  return [...items].sort();
}

function discount(price) {
  const discounted = price * 0.9;
  return discounted;
}
```

### No Saving `this` References

```javascript
// BAD: self/that pattern
function Timer() {
  const self = this;
  setInterval(function () {
    self.tick();
  }, 1000);
}

// GOOD: Arrow function preserves lexical this
function Timer() {
  setInterval(() => {
    this.tick();
  }, 1000);
}
```

### No Static-Only Classes

```javascript
// BAD: Container class with only static members
class StringUtils {
  static capitalize(s) { ... }
  static truncate(s, len) { ... }
}

// GOOD: Export functions directly
export function capitalize(s) { ... }
export function truncate(s, len) { ... }
```

### Private Fields with `#`

Use native private fields instead of underscore conventions (ES2022).

```javascript
// BAD: Convention-only privacy — still publicly accessible
class User {
  constructor(name) {
    this._name = name;
  }
}

// GOOD: Enforced at the syntax level
class User {
  #name;
  constructor(name) {
    this.#name = name;
  }
  getName() {
    return this.#name;
  }
}
```

---

## Async / Await

### Prefer `async`/`await` Over Raw Promises

```javascript
// GOOD: Readable, linear flow
async function fetchUserData(id) {
  const user = await getUser(id);
  const profile = await getProfile(user.profileId);
  return { ...user, ...profile };
}

// BAD: Nested .then chains
function fetchUserData(id) {
  return getUser(id).then((user) =>
    getProfile(user.profileId).then((profile) => ({ ...user, ...profile }))
  );
}
```

### Concurrent Execution

```javascript
// Sequential (slow) — each await blocks
const users = await fetchUsers();
const orders = await fetchOrders();

// Concurrent (fast) — both run simultaneously
const [users, orders] = await Promise.all([fetchUsers(), fetchOrders()]);

// With error isolation — settle all, inspect individually
const results = await Promise.allSettled([fetchUsers(), fetchOrders()]);

for (const result of results) {
  if (result.status === 'fulfilled') {
    process(result.value);
  } else {
    logger.error(result.reason);
  }
}
```

### Avoid Floating Promises

```javascript
// BAD: Unhandled promise — errors silently lost
fetchData();

// GOOD: Await or explicitly handle
await fetchData();

// GOOD: Fire-and-forget with error handling
fetchData().catch((error) => logger.error(error));
```

### AbortController for Cancellation

Use `AbortController` and `AbortSignal` to cancel fetch requests and other async operations.

```javascript
// Cancellable fetch
const controller = new AbortController();
fetch('/api/data', { signal: controller.signal }).catch((err) => {
  if (err.name === 'AbortError') return; // expected cancellation
  throw err;
});
controller.abort(); // cancel when needed

// Timeout pattern
fetch('/api/data', { signal: AbortSignal.timeout(5000) });
```

### `Promise.withResolvers()` for Deferred Promises

Use when resolve/reject need to be called outside the executor (ES2024; Node 22+, all modern browsers).

```javascript
// BAD: Capturing resolve in outer scope
let resolve;
const promise = new Promise((r) => {
  resolve = r;
});

// GOOD: Clean deferred pattern
const { promise, resolve } = Promise.withResolvers();
element.addEventListener('click', () => resolve(true));
```

---

## Collections

### Literal Syntax Over Constructors

```javascript
// BAD: Constructor syntax
const items = new Array();
const data = new Object();

// GOOD: Literal syntax
const items = [];
const data = {};
```

### `Map` and `Set` for Dynamic Collections

Use `Map` for key-value pairs with dynamic or user-provided keys. Use `Set` for unique values and fast membership checks.

```javascript
// BAD: Plain object as dictionary — prototype pollution risk
const counts = {};
keys.forEach((key) => {
  counts[key] = (counts[key] || 0) + 1;
});

// GOOD: Map for dynamic keys
const counts = new Map();
keys.forEach((key) => {
  counts.set(key, (counts.get(key) ?? 0) + 1);
});

// GOOD: Set for uniqueness and O(1) lookup
const seen = new Set();
const unique = items.filter((item) => {
  if (seen.has(item.id)) return false;
  seen.add(item.id);
  return true;
});
```

### `structuredClone()` for Deep Copies

Note: `structuredClone` cannot clone functions, DOM nodes, or objects with prototype chains.

```javascript
// BAD: Silently breaks Date, Map, Set, undefined, circular refs
const clone = JSON.parse(JSON.stringify(original));

// GOOD: Handles all structured-cloneable types
const clone = structuredClone(original);

// Shallow copies: spread is fine
const shallow = { ...original };
```

### `Object.freeze()` for Configuration

```javascript
const CONFIG = Object.freeze({
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3
});

CONFIG.timeout = 10000; // Silently fails (throws in strict mode)
```

---

## Iteration

### Functional Methods Over Loops

```javascript
// BAD: Imperative loop
const result = [];
for (let i = 0; i < items.length; i++) {
  if (items[i].active) {
    result.push(items[i].name);
  }
}

// GOOD: Declarative chain
const result = items.filter((item) => item.active).map((item) => item.name);
```

### `for...of` When You Need `break`/`continue`

```javascript
for (const item of items) {
  if (item.skip) continue;
  if (item.done) break;
  process(item);
}
```

### Object Iteration

```javascript
// Iterate keys, values, or entries
for (const [key, value] of Object.entries(config)) {
  console.log(`${key}: ${value}`);
}

// Map over an iterable efficiently
const mapped = Array.from(iterable, transformFn);

// BAD: Intermediate array
const mapped = [...iterable].map(transformFn);
```

---

## General Anti-Patterns to Avoid

The table below summarizes rules detailed in earlier sections for quick reference.

| Anti-Pattern                   | Preferred Alternative                 |
| ------------------------------ | ------------------------------------- |
| Magic numbers                  | Named constants                       |
| `export let` (mutable)         | Getter functions for mutable state    |
| `eval()` / `Function()`        | Structured alternatives               |
| Boolean flag parameters        | Separate functions or options object  |
| Static-only classes            | Exported functions and constants      |
| Prototype mutation             | Extension via composition             |
| `var`                          | `const` by default, `let` when needed |
| `==` / `!=`                    | `===` / `!==` (exception: `== null`)  |
| `for...in` on arrays           | `for...of` or array methods           |
| `new Object()` / `new Array()` | Literal syntax `{}` / `[]`            |
| `Object.assign({}, obj)`       | Spread `{ ...obj }`                   |
| `obj.hasOwnProperty(key)`      | `Object.hasOwn(obj, key)`             |
| Nested ternaries               | Intermediate variables or if/else     |
| Chained assignment `a = b = c` | Separate declarations                 |
| Saving `this` (`self`/`that`)  | Arrow functions                       |

---

## References

- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
- [TypeScript Style Guide (mkosir)](https://mkosir.github.io/typescript-style-guide/)
- [andredesousa/typescript-best-practices](https://github.com/andredesousa/typescript-best-practices)
