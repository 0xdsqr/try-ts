<div align="center">

# try-ts

**Rust-style error handling for TypeScript. No exceptions, just values.**

</div>

## Table of Contents

- [The Problem](#-the-problem)
- [The Solution](#-the-solution)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Key Concepts](#-key-concepts)
- [API Reference](#-api-reference)
- [Real-World Examples](#-real-world-examples)
- [Why `source`?](#-why-source)
- [Development](#-development)
- [License](#-license)

## ⇁ The Problem

JavaScript's error handling has two fundamental flaws:

### 1. Errors Are Untyped

```typescript
try {
  const user = await fetchUser(id)
} catch (e) {
  // What is `e`? TypeScript says `unknown`.
  // Network error? Parse error? Validation error? No idea.
}
```

### 2. Functions Lie About Their Return Types

```typescript
function divide(a: number, b: number): number {
  if (b === 0) throw new Error("Division by zero")
  return a / b
}
// Signature promises `number`, but might explode.
```

## ⇁ The Solution

**try-ts** brings Rust's `Result<T, E>` pattern to TypeScript:

- **Typed errors** — Every failure is encoded in the return type
- **Honest signatures** — If it can fail, the type says so
- **Early returns via generators** — Clean, linear code
- **Exhaustive handling** — TypeScript ensures you handle every case

```typescript
import { ok, err, tryPromise, match, genAsync, awaitResult } from "try-ts"

// Explicit, typed, composable
const getUser = (id: string) =>
  genAsync(async function* () {
    const response = yield* awaitResult(
      tryPromise(() => fetch(`/api/users/${id}`), {
        catch: (e) => new NetworkError(e),
      })
    )

    if (!response.ok) {
      return err(new HttpError(response.status, response.statusText, id))
    }

    return ok(await response.json())
  })
```

## ⇁ Installation

| Package Manager | Command |
|-----------------|---------|
| bun | `bun add try-ts` |
| npm | `npm install try-ts` |
| pnpm | `pnpm add try-ts` |

## ⇁ Quick Start

```typescript
import { ok, err, tryPromise, match } from "try-ts"

// Create results
const success = ok(42)
const failure = err("something went wrong")

// Wrap async operations
const result = await tryPromise(
  () => fetch("/api/users"),
  { catch: (e) => new NetworkError(e) }
)

// Pattern match on results
const message = match(result, {
  ok: (response) => `Got ${response.status}`,
  err: (error) => `Failed: ${error.message}`,
})
```

## ⇁ Key Concepts

<details><summary><strong>The Result Pattern</strong></summary>

A `Result` is a container that holds either a success value or an error—never both, never neither.

```typescript
type Result<T, E> = 
  | { ok: true; value: T }    // Success
  | { ok: false; error: E }   // Failure
```

You must check before accessing:

```typescript
const result = divide(10, 0)

if (result.ok) {
  console.log(result.value)  // TypeScript knows this is safe
} else {
  console.log(result.error)  // TypeScript knows this is the error
}
```

| Aspect | try/catch | Result |
|--------|-----------|--------|
| Error types | `unknown` | Fully typed |
| Signature honesty | Lies | Truth |
| Composition | Nested blocks | Chainable |
| Forgetting to handle | Silent bug | Compile error |

</details>

<details><summary><strong>Generator Pattern (Rust's ? operator)</strong></summary>

The `gen`/`unwrap` pattern gives you Rust's `?` operator semantics:

```typescript
import { gen, unwrap, ok, err } from "try-ts"

const divide = (a: number, b: number): Result<number, "DivisionByZero"> =>
  b === 0 ? err("DivisionByZero") : ok(a / b)

const sqrt = (n: number): Result<number, "NegativeNumber"> =>
  n < 0 ? err("NegativeNumber") : ok(Math.sqrt(n))

// Compose multiple fallible operations
const calculate = (x: number, y: number) =>
  gen(function* () {
    const divided = yield* unwrap(divide(x, y))  // Early return if Err
    const rooted = yield* unwrap(sqrt(divided))  // Early return if Err
    return ok(rooted)
  })
```

Think of it as a railway track:

```
SUCCESS TRACK:  ──●──────●──────●──────●───▶ return
                  │      │      │      │
                 op1    op2    op3    op4
                  │      │      │      │
ERROR TRACK:    ◀─┴──────┴──────┴──────┘ (immediate exit on first error)
```

</details>

## ⇁ API Reference

<details><summary><strong>Core</strong></summary>

| Function | Description |
|----------|-------------|
| `ok(value)` | Create a success result |
| `err(error)` | Create a failure result |
| `isOk(result)` | Type guard for Ok |
| `isErr(result)` | Type guard for Err |

</details>

<details><summary><strong>Transformations</strong></summary>

| Function | Description |
|----------|-------------|
| `map(result, fn)` | Transform the success value |
| `mapErr(result, fn)` | Transform the error value |
| `flatMap(result, fn)` | Chain operations that return Results |
| `match(result, { ok, err })` | Pattern match on result |

</details>

<details><summary><strong>Unwrapping</strong></summary>

| Function | Description |
|----------|-------------|
| `unwrapOr(result, default)` | Get value or default |
| `unwrapOrElse(result, fn)` | Get value or compute from error |

</details>

<details><summary><strong>Boundaries</strong></summary>

| Function | Description |
|----------|-------------|
| `trySync(fn, onError)` | Wrap sync function that may throw |
| `tryPromise(fn, options)` | Wrap async function with optional retry |
| `retry(fn, options)` | Retry with backoff strategies |

```typescript
// Synchronous
const parsed = trySync(
  () => JSON.parse(input),
  (e) => new ParseError(e)
)

// Async with retry
const response = await tryPromise(
  () => fetch("/api/data"),
  {
    catch: (e) => new NetworkError(e),
    retry: { times: 3, delayMs: 200, backoff: "exponential" }
  }
)
```

</details>

<details><summary><strong>Collectors</strong></summary>

| Function | Description |
|----------|-------------|
| `collect(results)` | Collect array of Results into Result of array |
| `collectAsync(promises)` | Same for promises |

```typescript
collect([ok(1), ok(2), ok(3)])     // Ok([1, 2, 3])
collect([ok(1), err("x"), ok(3)]) // Err("x")
```

</details>

<details><summary><strong>Generators</strong></summary>

| Function | Description |
|----------|-------------|
| `gen(fn)` | Generator-based do-notation for sync code |
| `genAsync(fn)` | Generator-based do-notation for async code |
| `unwrap(result)` | Yield value or short-circuit in generators |
| `awaitResult(promise)` | Await and unwrap in async generators |

</details>

<details><summary><strong>Error Types</strong></summary>

Built-in error types for common cases:

| Error | Use Case |
|-------|----------|
| `NetworkError` | Fetch/connection failures |
| `HttpError` | Non-2xx HTTP responses |
| `ValidationError` | Input validation failures |
| `ParseError` | JSON/data parsing failures |
| `NotFoundError` | Resource not found |
| `TimeoutError` | Operation timeouts |

```typescript
import { matchError } from "try-ts"

const message = matchError(error, {
  NetworkError: (e) => `Connection failed: ${e.cause}`,
  HttpError: (e) => `HTTP ${e.status}: ${e.statusText}`,
  ValidationError: (e) => e.messages.join(", "),
  ParseError: (e) => `Failed to parse: ${e.cause}`,
  NotFoundError: (e) => `${e.resource} not found`,
  TimeoutError: (e) => `${e.operation} timed out`,
})
```

</details>

## ⇁ Real-World Examples

<details><summary><strong>Form Validation</strong></summary>

```typescript
const validateEmail = (email: string): Result<string, ValidationError> => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email) 
    ? ok(email) 
    : err(new ValidationError(["Invalid email"], "email"))
}

const validateAge = (age: string): Result<number, ValidationError> => {
  const n = parseInt(age, 10)
  if (isNaN(n)) return err(new ValidationError(["Must be a number"], "age"))
  if (n < 18) return err(new ValidationError(["Must be 18+"], "age"))
  return ok(n)
}

const validateForm = (form: { email: string; age: string }) =>
  gen(function* () {
    const email = yield* unwrap(validateEmail(form.email))
    const age = yield* unwrap(validateAge(form.age))
    return ok({ email, age })
  })
```

</details>

<details><summary><strong>API Client with Retry</strong></summary>

```typescript
const fetchWithRetry = <T>(url: string) =>
  genAsync(async function* () {
    const response = yield* awaitResult(
      tryPromise(() => fetch(url), {
        catch: (e) => new NetworkError(e, url),
        retry: { times: 3, delayMs: 200, backoff: "exponential" }
      })
    )

    if (!response.ok) {
      return err(new HttpError(response.status, response.statusText, url))
    }

    const data = yield* awaitResult(
      tryPromise(() => response.json() as Promise<T>, {
        catch: (e) => new ParseError(e)
      })
    )

    return ok(data)
  })
```

</details>

## ⇁ Why `source`?

Just cause. I need to find him, he uses it (open issue if you know name).

## ⇁ Development

```bash
nix develop        # Enter dev shell
bun test           # Run tests
bun run build      # Build
nix fmt            # Format
```

## ⇁ License

MIT - do whatever you want with it. 
