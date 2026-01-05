import { describe, expect, test } from "bun:test"
import { awaitResult, gen, genAsync, unwrap } from "../source/generators.ts"
import { err, ok, type Result } from "../source/result.ts"

describe("gen", () => {
  test("returns Ok when all unwraps succeed", () => {
    const result = gen(function* () {
      const a = yield* unwrap(ok(1))
      const b = yield* unwrap(ok(2))
      return ok(a + b)
    })
    expect(result.ok).toBe(true)
    expect(result.ok && result.value).toBe(3)
  })

  test("returns first Err encountered", () => {
    const result = gen(function* () {
      const a = yield* unwrap(ok(1))
      const b = yield* unwrap(err("failed") as Result<number, string>)
      return ok(a + b)
    })
    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toBe("failed")
  })

  test("short-circuits on error", () => {
    let sideEffect = false
    const result = gen(function* () {
      yield* unwrap(err("early exit") as Result<number, string>)
      sideEffect = true
      return ok(42)
    })
    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toBe("early exit")
    expect(sideEffect).toBe(false)
  })

  test("works with different error types", () => {
    type MyError = { code: number; message: string }
    const result = gen(function* () {
      const x = yield* unwrap(
        err({ code: 404, message: "not found" }) as Result<number, MyError>,
      )
      return ok(x)
    })
    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toEqual({
      code: 404,
      message: "not found",
    })
  })
})

describe("genAsync", () => {
  test("returns Ok when all awaits succeed", async () => {
    const result = await genAsync(async function* () {
      const a = yield* awaitResult(Promise.resolve(ok(10)))
      const b = yield* awaitResult(Promise.resolve(ok(20)))
      return ok(a + b)
    })
    expect(result.ok).toBe(true)
    expect(result.ok && result.value).toBe(30)
  })

  test("returns first Err encountered", async () => {
    const result = await genAsync(async function* () {
      const a = yield* awaitResult(Promise.resolve(ok(10)))
      const b = yield* awaitResult(
        Promise.resolve(err("async fail") as Result<number, string>),
      )
      return ok(a + b)
    })
    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toBe("async fail")
  })

  test("short-circuits on error", async () => {
    let sideEffect = false
    const result = await genAsync(async function* () {
      yield* awaitResult(Promise.resolve(err("stop") as Result<void, string>))
      sideEffect = true
      return ok(undefined)
    })
    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toBe("stop")
    expect(sideEffect).toBe(false)
  })

  test("handles real async operations", async () => {
    const fetchUser = async (
      id: number,
    ): Promise<Result<{ name: string }, string>> => {
      await new Promise((r) => setTimeout(r, 1))
      return id > 0 ? ok({ name: "Alice" }) : err("invalid id")
    }

    const result = await genAsync(async function* () {
      const user = yield* awaitResult(fetchUser(1))
      return ok(user.name)
    })
    expect(result.ok).toBe(true)
    expect(result.ok && result.value).toBe("Alice")
  })
})

describe("unwrap", () => {
  test("yields value from Ok", () => {
    const generator = unwrap(ok(42))
    const step = generator.next()
    expect(step.done).toBe(true)
    expect(step.value).toBe(42)
  })

  test("yields Err and stops", () => {
    const generator = unwrap(err("error"))
    const step = generator.next()
    expect(step.done).toBe(false)
    expect(step.value?.ok).toBe(false)
  })
})

describe("awaitResult", () => {
  test("yields value from Ok promise", async () => {
    const generator = awaitResult(Promise.resolve(ok(42)))
    const step = await generator.next()
    expect(step.done).toBe(true)
    expect(step.value).toBe(42)
  })

  test("yields Err and stops", async () => {
    const generator = awaitResult(Promise.resolve(err("error")))
    const step = await generator.next()
    expect(step.done).toBe(false)
    expect(step.value?.ok).toBe(false)
  })
})
