export type Ok<T> = { readonly ok: true; readonly value: T }

export type Err<E> = { readonly ok: false; readonly error: E }

export type Result<T, E> = Ok<T> | Err<E>

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value })

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error })

export const Result = {
  ok,
  err,

  isOk<T, E>(result: Result<T, E>): result is Ok<T> {
    return result.ok
  },

  isErr<T, E>(result: Result<T, E>): result is Err<E> {
    return !result.ok
  },

  map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
    return result.ok ? ok(fn(result.value)) : result
  },

  mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
    return result.ok ? result : err(fn(result.error))
  },

  flatMap<T, U, E, F>(
    result: Result<T, E>,
    fn: (value: T) => Result<U, F>,
  ): Result<U, E | F> {
    return result.ok ? fn(result.value) : result
  },

  unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    return result.ok ? result.value : defaultValue
  },

  unwrapOrElse<T, E>(result: Result<T, E>, fn: (error: E) => T): T {
    return result.ok ? result.value : fn(result.error)
  },

  match<T, E, U>(
    result: Result<T, E>,
    handlers: { ok: (value: T) => U; err: (error: E) => U },
  ): U {
    return result.ok ? handlers.ok(result.value) : handlers.err(result.error)
  },
}
