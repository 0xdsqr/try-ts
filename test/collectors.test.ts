import { describe, expect, test } from "bun:test"
import { collect, collectAsync } from "../source/collectors.ts"
import { err, ok, type Result } from "../source/result.ts"

describe("collect", () => {
  test("collects all Ok values into array", () => {
    const results = [ok(1), ok(2), ok(3)]
    const result = collect(results)
    expect(result.ok).toBe(true)
    expect(result.ok && result.value).toEqual([1, 2, 3])
  })

  test("returns first Err encountered", () => {
    const results: Result<number, string>[] = [ok(1), err("fail"), ok(3)]
    const result = collect(results)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toBe("fail")
  })

  test("returns empty array for empty input", () => {
    const result = collect([])
    expect(result.ok).toBe(true)
    expect(result.ok && result.value).toEqual([])
  })

  test("returns first Err when multiple errors exist", () => {
    const results: Result<number, string>[] = [err("first"), err("second")]
    const result = collect(results)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toBe("first")
  })

  test("works with different value types", () => {
    const results = [ok("a"), ok("b"), ok("c")]
    const result = collect(results)
    expect(result.ok).toBe(true)
    expect(result.ok && result.value).toEqual(["a", "b", "c"])
  })

  test("works with complex objects", () => {
    const results = [ok({ id: 1 }), ok({ id: 2 })]
    const result = collect(results)
    expect(result.ok).toBe(true)
    expect(result.ok && result.value).toEqual([{ id: 1 }, { id: 2 }])
  })
})

describe("collectAsync", () => {
  test("collects all resolved Ok values", async () => {
    const promises = [
      Promise.resolve(ok(1)),
      Promise.resolve(ok(2)),
      Promise.resolve(ok(3)),
    ]
    const result = await collectAsync(promises)
    expect(result.ok).toBe(true)
    expect(result.ok && result.value).toEqual([1, 2, 3])
  })

  test("returns first Err from resolved promises", async () => {
    const promises: Promise<Result<number, string>>[] = [
      Promise.resolve(ok(1)),
      Promise.resolve(err("async fail")),
      Promise.resolve(ok(3)),
    ]
    const result = await collectAsync(promises)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toBe("async fail")
  })

  test("returns empty array for empty input", async () => {
    const result = await collectAsync([])
    expect(result.ok).toBe(true)
    expect(result.ok && result.value).toEqual([])
  })

  test("handles concurrent async operations", async () => {
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
    const promises = [
      delay(10).then(() => ok(1)),
      delay(5).then(() => ok(2)),
      delay(15).then(() => ok(3)),
    ]
    const result = await collectAsync(promises)
    expect(result.ok).toBe(true)
    expect(result.ok && result.value).toEqual([1, 2, 3])
  })

  test("returns first Err by array order not resolution order", async () => {
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
    const promises: Promise<Result<number, string>>[] = [
      delay(20).then(() => err("slow error")),
      delay(5).then(() => err("fast error")),
      delay(10).then(() => ok(3)),
    ]
    const result = await collectAsync(promises)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toBe("slow error")
  })
})
