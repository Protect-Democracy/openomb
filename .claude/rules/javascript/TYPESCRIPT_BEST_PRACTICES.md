---
description: TypeScript-specific best practices: types, generics, discriminated unions, and modern TS features.
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.svelte"
  - "**/*.ts*.jinja"
  - "**/*.tsx*.jinja"
  - "**/*.svelte*.jinja"
---

# TypeScript Core Patterns

TypeScript-specific best practices based on the Google TypeScript Style Guide, TypeScript Handbook, and modern community standards. For general JavaScript patterns (naming, functions, async, error handling), see `JAVASCRIPT_BEST_PRACTICES.md`.

Borrowed from: [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html), [TypeScript Style Guide (mkosir)](https://mkosir.github.io/typescript-style-guide/), [andredesousa/typescript-best-practices](https://github.com/andredesousa/typescript-best-practices)

---

## Type Annotations

### Leverage Inference

TypeScript's inference is powerful. Annotate only when it adds clarity — function parameters, public API return types, and ambiguous expressions.

```typescript
// GOOD: Inference handles this
const name = 'Alice';
const count = 42;
const items = [1, 2, 3];

// GOOD: Annotate function signatures for clarity
function fetchUser(id: string): Promise<User> {
  return db.find(id);
}

// BAD: Redundant annotation
const name: string = 'Alice';
const items: number[] = [1, 2, 3];
```

### Never Use `any`

Use `unknown` instead — it requires narrowing before use, keeping type safety intact.

```typescript
// BAD: Silently disables type checking
function parse(input: any): any {
  return JSON.parse(input);
}

// GOOD: Type-safe with narrowing
function parse(input: unknown): Record<string, unknown> {
  if (typeof input !== 'string') {
    throw new Error('Expected string input');
  }
  return JSON.parse(input) as Record<string, unknown>;
}
```

### Use Lowercase Primitives

```typescript
// BAD: Wrapper objects
let name: String;
let count: Number;
let active: Boolean;

// GOOD: Primitive types
let name: string;
let count: number;
let active: boolean;
```

### Prefer `interface` for Objects, `type` for Unions

```typescript
// Interface for object shapes and class contracts
interface User {
  id: string;
  name: string;
  email: string;
}

// Interface extension
interface AdminUser extends User {
  permissions: string[];
}

// Type for unions, intersections, and mapped types
type Result<TData> = { success: true; data: TData } | { success: false; error: Error };
type StringOrNumber = string | number;
type UserKeys = keyof User;
```

### No `I` Prefix on Interfaces

```typescript
// BAD: Hungarian notation
interface IUserService { ... }
interface IRepository { ... }

// GOOD: Clean names
interface UserService { ... }
interface Repository { ... }
```

### Optional Properties vs `| undefined`

```typescript
// GOOD: Use ? for optional properties
interface Config {
  host: string;
  port: number;
  timeout?: number;
}

// BAD: Verbose and behaves differently
interface Config {
  host: string;
  port: number;
  timeout: number | undefined;
}
```

---

## Generics

### Descriptive Names with `T` Prefix

Generic type parameters must start with the capital letter `T` followed by a descriptive name. Single-letter generics (`T`, `K`, `U`) are disallowed — the more parameters introduced, the easier it is to confuse them. The `T` prefix makes it immediately obvious that it's a generic type parameter, not a regular type.

```typescript
// BAD: Single-letter generics are ambiguous
const createPair = <T, K extends string>(
  first: T,
  second: K,
): [T, K] => {
  return [first, second];
};

// GOOD: Descriptive names starting with capital T
const createPair = <TFirst, TSecond extends string>(
  first: TFirst,
  second: TSecond,
): [TFirst, TSecond] => {
  return [first, second];
};

// BAD: Generic parameter shadows existing type — which 'Request' is which?
const handle = <Request extends Request>(req: Request): void => { ... }

// GOOD: Prefix generic parameter with capital T
const handle = <TRequest extends Request>(req: TRequest): void => { ... }
```

### Use Generics When Genuinely Needed

Do not over-abstract with generics when a concrete type suffices.

```typescript
// BAD: Generic adds no value here
function getLength<TArr extends unknown[]>(arr: TArr): number {
  return arr.length;
}

// GOOD: Concrete type is simpler
function getLength(arr: unknown[]): number {
  return arr.length;
}

// GOOD: Generic is genuinely useful — preserves caller's type
function first<TItem>(items: TItem[]): TItem | undefined {
  return items[0];
}
```

### Leverage Built-in Utility Types

Prefer built-in utilities over hand-rolled equivalents: `Partial<T>`, `Required<T>`, `Readonly<T>`, `ReadonlyArray<T>`, `Pick<T, K>`, `Omit<T, K>`, `Record<K, V>`, `ReturnType<T>`, `Parameters<T>`.

### Array Syntax

Use `T[]` for simple types, `Array<T>` for complex expressions, `readonly T[]` for immutable arrays.

```typescript
// Simple types: T[]
const names: string[] = [];
const users: User[] = [];

// Complex types: Array<T>
const handlers: Array<(event: Event) => void> = [];

// Immutable: readonly T[]
function process(items: readonly string[]): void { ... }
```

---

## Data Structures

### Discriminated Unions

The most valuable TypeScript pattern. Use a literal `kind` or `type` field to enable exhaustive checks.

```typescript
interface Circle {
  kind: 'circle';
  radius: number;
}

interface Rectangle {
  kind: 'rectangle';
  width: number;
  height: number;
}

type Shape = Circle | Rectangle;

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rectangle':
      return shape.width * shape.height;
  }
  // TypeScript warns if a case is unhandled (with strictNullChecks)
}
```

### `as const satisfies` for Static Data

Combines immutability, validation, and narrow inference in one expression.

```typescript
interface Route {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
}

// Validates against Route[], keeps literal types narrow
const routes = [
  { path: '/users', method: 'GET' },
  { path: '/users', method: 'POST' }
] as const satisfies readonly Route[];

// routes[0].method is "GET", not string
```

### `readonly` for Immutability

```typescript
// Immutable properties
interface Config {
  readonly host: string;
  readonly port: number;
}

// Immutable arrays
function process(items: readonly string[]): void {
  // items.push("x"); // Error: Property 'push' does not exist
}

// Immutable parameters
function transform(data: Readonly<User>): User {
  return { ...data, name: data.name.toUpperCase() };
}
```

### Dictionaries with `Record`

```typescript
// GOOD: Typed dictionaries
const scores: Record<string, number> = {
  alice: 95,
  bob: 87
};

// BAD: Avoid {} as a type — it means "any non-nullish value"
let data: {};

// GOOD: Be explicit about what you mean
let data: Record<string, unknown>; // dictionary
let data: object; // non-primitive
let data: unknown; // anything
```

---

## Error Handling (TypeScript-Specific)

### Catch as `unknown`

```typescript
// GOOD: Narrow from unknown
try {
  await fetchData();
} catch (error: unknown) {
  if (error instanceof HttpError) {
    handleHttpError(error);
  } else if (error instanceof Error) {
    logger.error(error.message);
  } else {
    logger.error('Unknown error', error);
  }
}

// BAD: Assumes error shape
try {
  await fetchData();
} catch (error) {
  console.log(error.message); // error is unknown — unsafe
}
```

### Result Pattern for Expected Failures

```typescript
type Result<TData, TError = Error> =
  | { success: true; data: TData }
  | { success: false; error: TError };

function parseConfig(raw: string): Result<Config> {
  try {
    const data = JSON.parse(raw);
    return { success: true, data: validateConfig(data) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

// Usage — caller must handle both cases
const result = parseConfig(input);
if (!result.success) {
  logger.error(result.error.message);
  return;
}
// result.data is narrowed to Config here
```

---

## Modules & Imports (TypeScript-Specific)

### `import type` for Type-Only Imports

```typescript
// GOOD: Separates compile-time from runtime dependencies
import type { User, Config } from './types';
import { fetchUser, createUser } from './users';

// GOOD: Inline type imports
import { type User, fetchUser } from './users';
```

### No `namespace`

```typescript
// BAD: Legacy TypeScript module pattern
namespace Utils { ... }

// GOOD: ES modules
export function formatDate(date: Date): string { ... }
```

---

## Constructor Parameter Properties

```typescript
// GOOD: Concise with parameter properties
class UserService {
  constructor(
    private readonly repository: UserRepository,
    private readonly cache: Cache
  ) {}
}

// BAD: Verbose manual assignment
class UserService {
  private readonly repository: UserRepository;
  private readonly cache: Cache;

  constructor(repository: UserRepository, cache: Cache) {
    this.repository = repository;
    this.cache = cache;
  }
}
```

---

## Modern TypeScript Features

### `satisfies` Over `as` (TS 4.9+)

```typescript
// BAD: as assertion — no validation, can lie to the compiler
const config = { host: 'localhost', port: 8080 } as Config;

// GOOD: satisfies — validates AND preserves narrow inference
const config = { host: 'localhost', port: 8080 } satisfies Config;
// config.host is "localhost" (literal), not string
```

### `as const` for Literal Narrowing

```typescript
// Without as const: type is string[]
const statuses = ['active', 'inactive', 'pending'];

// With as const: type is readonly ["active", "inactive", "pending"]
const statuses = ['active', 'inactive', 'pending'] as const;
type Status = (typeof statuses)[number]; // "active" | "inactive" | "pending"
```

### Template Literal Types

```typescript
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type ApiRoute = `/api/${string}`;
type Endpoint = `${HttpMethod} ${ApiRoute}`;

// "GET /api/users" is valid
// "PATCH /api/users" is a type error
```

### `@ts-expect-error` Over `@ts-ignore`

```typescript
// BAD: Silently suppresses — stays forever even if the error resolves
// @ts-ignore
const x = brokenCall();

// GOOD: Alerts you when the suppression is no longer needed
// @ts-expect-error — third-party types are incorrect for overloaded call
const x = brokenCall();
```

### `using` for Resource Cleanup (TS 5.2+)

```typescript
function processFile(path: string): void {
  using file = openFile(path); // auto-closed when scope exits
  const data = file.read();
  transform(data);
  // file[Symbol.dispose]() called automatically
}
```

---

## Anti-Patterns to Avoid

| Anti-Pattern                                   | Preferred Alternative                       |
| ---------------------------------------------- | ------------------------------------------- |
| `any`                                          | `unknown` with type narrowing               |
| `@ts-ignore`                                   | `@ts-expect-error` with description         |
| Type assertions (`as`) without justification   | Type guards and proper narrowing            |
| Non-null assertion (`!`) without justification | Optional chaining (`?.`) or explicit checks |
| `const enum`                                   | Union literal types or regular enums        |
| Single-letter generics (`T`, `K`, `U`)         | Descriptive names with `T` prefix           |
| `namespace`                                    | ES modules                                  |
| JSDoc type annotations alongside TypeScript    | TypeScript types only, JSDoc for docs       |

---

## References

- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [TypeScript Style Guide (mkosir)](https://mkosir.github.io/typescript-style-guide/)
- [andredesousa/typescript-best-practices](https://github.com/andredesousa/typescript-best-practices)
- [ts.dev Style Guide](https://ts.dev/style/)
