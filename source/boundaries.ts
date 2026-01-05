import { err, ok, type Result } from "./result.ts"

type RetryOptions = {
  times: number
  delayMs: number
  backoff?: "exponential" | "linear"
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function calculateDelay(attempt: number, options: RetryOptions): number {
  switch (options.backoff) {
    case "exponential":
      return options.delayMs * 2 ** (attempt - 1)
    case "linear":
      return options.delayMs * attempt
    default:
      return options.delayMs
  }
}

async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  let attempt = 0
  let lastError: unknown

  while (attempt <= options.times) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      attempt++
      if (attempt > options.times) break
      await sleep(calculateDelay(attempt, options))
    }
  }

  throw lastError
}

function trySync<T, E>(
  fn: () => T,
  onError: (cause: unknown) => E,
): Result<T, E> {
  try {
    return ok(fn())
  } catch (cause: unknown) {
    return err(onError(cause))
  }
}

async function tryPromise<T, E>(
  fn: () => Promise<T>,
  options: {
    catch: (cause: unknown) => E
    retry?: RetryOptions
  },
): Promise<Result<T, E>> {
  try {
    const value = options.retry ? await retry(fn, options.retry) : await fn()
    return ok(value)
  } catch (cause: unknown) {
    return err(options.catch(cause))
  }
}

export { type RetryOptions, retry, trySync, tryPromise }
