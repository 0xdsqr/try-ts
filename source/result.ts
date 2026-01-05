type Ok<T> = { readonly ok: true; readonly value: T }

type Err<E> = { readonly ok: false; readonly error: E }

type Result<T, E> = Ok<T> | Err<E>

function ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

function err<E>(error: E): Result<never, E> {
  return { ok: false, error }
}

function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok
}

function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.ok
}

function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result
}

function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F,
): Result<T, F> {
  return result.ok ? result : err(fn(result.error))
}

function flatMap<T, U, E, F>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, F>,
): Result<U, E | F> {
  return result.ok ? fn(result.value) : result
}

function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.ok ? result.value : defaultValue
}

function unwrapOrElse<T, E>(result: Result<T, E>, fn: (error: E) => T): T {
  return result.ok ? result.value : fn(result.error)
}

function match<T, E, U>(
  result: Result<T, E>,
  handlers: { ok: (value: T) => U; err: (error: E) => U },
): U {
  return result.ok ? handlers.ok(result.value) : handlers.err(result.error)
}

export {
  type Ok,
  type Err,
  type Result,
  ok,
  err,
  isOk,
  isErr,
  map,
  mapErr,
  flatMap,
  unwrapOr,
  unwrapOrElse,
  match,
}
