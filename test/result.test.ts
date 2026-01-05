import { describe, expect, test } from "bun:test"
import {
  err,
  flatMap,
  isErr,
  isOk,
  map,
  mapErr,
  match,
  ok,
  unwrapOr,
  unwrapOrElse,
} from "../source/result"

describe("ok", () => {
  test("creates Ok result with value", () => {
    const result = ok(42)
    expect(result.ok).toBe(true)
    expect(result.ok && result.value).toBe(42)
  })

  test("works with different types", () => {
    const str = ok("hello")
    const obj = ok({ a: 1 })
    const nul = ok(null)
    const undef = ok(undefined)

    expect(str.ok && str.value).toBe("hello")
    expect(obj.ok && obj.value).toEqual({ a: 1 })
    expect(nul.ok && nul.value).toBe(null)
    expect(undef.ok && undef.value).toBe(undefined)
  })
})

describe("err", () => {
  test("creates Err result with error", () => {
    const result = err("failed")
    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toBe("failed")
  })

  test("works with different error types", () => {
    const num = err(404)
    const obj = err({ code: "E001" })

    expect(!num.ok && num.error).toBe(404)
    expect(!obj.ok && obj.error).toEqual({ code: "E001" })
  })
})

describe("isOk", () => {
  test("returns true for Ok", () => {
    expect(isOk(ok(1))).toBe(true)
  })

  test("returns false for Err", () => {
    expect(isOk(err("fail"))).toBe(false)
  })
})

describe("isErr", () => {
  test("returns true for Err", () => {
    expect(isErr(err("fail"))).toBe(true)
  })

  test("returns false for Ok", () => {
    expect(isErr(ok(1))).toBe(false)
  })
})

describe("map", () => {
  test("transforms Ok value", () => {
    const result = map(ok(2), (x) => x * 3)
    expect(result.ok).toBe(true)
    expect(result.ok && result.value).toBe(6)
  })

  test("passes through Err unchanged", () => {
    const input = err("fail") as
      | ReturnType<typeof ok<number>>
      | ReturnType<typeof err<string>>
    const result = map(input, (x) => x * 3)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toBe("fail")
  })
})

describe("mapErr", () => {
  test("transforms Err value", () => {
    const result = mapErr(err("fail"), (e) => e.toUpperCase())
    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toBe("FAIL")
  })

  test("passes through Ok unchanged", () => {
    const input = ok(42) as
      | ReturnType<typeof ok<number>>
      | ReturnType<typeof err<string>>
    const result = mapErr(input, (e) => e.toUpperCase())
    expect(result.ok).toBe(true)
    expect(result.ok && result.value).toBe(42)
  })
})

describe("flatMap", () => {
  const divide = (a: number, b: number) =>
    b === 0 ? err("division by zero" as const) : ok(a / b)

  test("chains Ok results", () => {
    const result = flatMap(ok(10), (x) => divide(x, 2))
    expect(result.ok).toBe(true)
    expect(result.ok && result.value).toBe(5)
  })

  test("short-circuits on first Err", () => {
    const input = err("first error") as
      | ReturnType<typeof ok<number>>
      | ReturnType<typeof err<string>>
    const result = flatMap(input, () => ok(99))
    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toBe("first error")
  })

  test("returns Err from chained function", () => {
    const result = flatMap(ok(10), () => err("chained error"))
    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toBe("chained error")
  })
})

describe("unwrapOr", () => {
  test("returns value for Ok", () => {
    expect(unwrapOr(ok(42), 0)).toBe(42)
  })

  test("returns default for Err", () => {
    expect(unwrapOr(err("fail"), 0)).toBe(0)
  })
})

describe("unwrapOrElse", () => {
  test("returns value for Ok", () => {
    expect(unwrapOrElse(ok(42), () => 0)).toBe(42)
  })

  test("computes default from error for Err", () => {
    expect(unwrapOrElse(err("fail"), (e) => e.length)).toBe(4)
  })
})

describe("match", () => {
  test("calls ok handler for Ok", () => {
    const result = match(ok(42), {
      ok: (v) => `value: ${v}`,
      err: (e) => `error: ${e}`,
    })
    expect(result).toBe("value: 42")
  })

  test("calls err handler for Err", () => {
    const result = match(err("fail"), {
      ok: (v) => `value: ${v}`,
      err: (e) => `error: ${e}`,
    })
    expect(result).toBe("error: fail")
  })
})
