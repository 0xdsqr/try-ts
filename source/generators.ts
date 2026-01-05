import type { Err, Result } from "./result.ts"

function gen<T, E>(
  fn: () => Generator<Err<E>, Result<T, E>, unknown>,
): Result<T, E> {
  const iterator = fn()
  const step = iterator.next()

  while (!step.done) {
    return step.value as Result<T, E>
  }

  return step.value
}

async function genAsync<T, E>(
  fn: () => AsyncGenerator<Err<E>, Result<T, E>, unknown>,
): Promise<Result<T, E>> {
  const iterator = fn()
  const step = await iterator.next()

  while (!step.done) {
    return step.value as Result<T, E>
  }

  return step.value
}

function* unwrap<T, E>(result: Result<T, E>): Generator<Err<E>, T, unknown> {
  if (result.ok) {
    return result.value
  }
  yield result
  throw new Error("Unreachable")
}

async function* awaitResult<T, E>(
  promise: Promise<Result<T, E>>,
): AsyncGenerator<Err<E>, T, unknown> {
  const result = await promise
  if (result.ok) {
    return result.value
  }
  yield result
  throw new Error("Unreachable")
}

export { gen, genAsync, unwrap, awaitResult }
