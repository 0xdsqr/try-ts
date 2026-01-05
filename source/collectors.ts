import { ok, type Result } from "./result"

function collect<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = []
  for (const result of results) {
    if (!result.ok) return result
    values.push(result.value)
  }
  return ok(values)
}

async function collectAsync<T, E>(
  promises: Promise<Result<T, E>>[],
): Promise<Result<T[], E>> {
  return collect(await Promise.all(promises))
}

export { collect, collectAsync }
