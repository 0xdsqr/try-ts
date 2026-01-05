import { describe, expect, test } from "bun:test"
import { retry, tryPromise, trySync } from "../source/boundaries.ts"
import { err, ok } from "../source/result.ts"

describe("trySync", () => {
  test("returns Ok for successful function", () => {
    const result = trySync(
      () => JSON.parse('{"a":1}'),
      () => "parse error",
    )
    expect(result.ok).toBe(true)
    expect(result.ok && result.value).toEqual({ a: 1 })
  })

  test("returns Err for throwing function", () => {
    const result = trySync(
      () => JSON.parse("invalid json"),
      () => "parse error",
    )
    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toBe("parse error")
  })

  test("passes error to onError handler", () => {
    const result = trySync(
      () => {
        throw new Error("boom")
      },
      (e) => (e as Error).message,
    )
    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toBe("boom")
  })

  test("works with different return types", () => {
    const num = trySync(
      () => 42,
      () => "err",
    )
    const str = trySync(
      () => "hello",
      () => "err",
    )
    const arr = trySync(
      () => [1, 2, 3],
      () => "err",
    )

    expect(num.ok && num.value).toBe(42)
    expect(str.ok && str.value).toBe("hello")
    expect(arr.ok && arr.value).toEqual([1, 2, 3])
  })
})

describe("tryPromise", () => {
  test("returns Ok for resolved promise", async () => {
    const result = await tryPromise(() => Promise.resolve(42), {
      catch: () => "error",
    })
    expect(result.ok).toBe(true)
    expect(result.ok && result.value).toBe(42)
  })

  test("returns Err for rejected promise", async () => {
    const result = await tryPromise(
      () => Promise.reject(new Error("async fail")),
      { catch: (e) => (e as Error).message },
    )
    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toBe("async fail")
  })

  test("passes error to catch handler", async () => {
    const result = await tryPromise(() => Promise.reject({ code: 500 }), {
      catch: (e) => (e as { code: number }).code,
    })
    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toBe(500)
  })
})

describe("retry", () => {
  test("returns immediately on success", async () => {
    let attempts = 0
    const result = await retry(
      async () => {
        attempts++
        return "success"
      },
      { times: 3, delayMs: 10 },
    )
    expect(result).toBe("success")
    expect(attempts).toBe(1)
  })

  test("retries specified number of times", async () => {
    let attempts = 0
    await expect(
      retry(
        async () => {
          attempts++
          throw new Error("fail")
        },
        { times: 3, delayMs: 1 },
      ),
    ).rejects.toThrow("fail")
    expect(attempts).toBe(4)
  })

  test("succeeds after retries", async () => {
    let attempts = 0
    const result = await retry(
      async () => {
        attempts++
        if (attempts < 3) throw new Error("not yet")
        return "finally"
      },
      { times: 3, delayMs: 1 },
    )
    expect(result).toBe("finally")
    expect(attempts).toBe(3)
  })

  test("uses exponential backoff", async () => {
    let attempts = 0
    const startTimes: number[] = []

    await expect(
      retry(
        async () => {
          startTimes.push(Date.now())
          attempts++
          throw new Error("fail")
        },
        { times: 2, delayMs: 20, backoff: "exponential" },
      ),
    ).rejects.toThrow()

    expect(attempts).toBe(3)
    const gap1 = startTimes[1]! - startTimes[0]!
    const gap2 = startTimes[2]! - startTimes[1]!
    expect(gap1).toBeGreaterThanOrEqual(15)
    expect(gap2).toBeGreaterThan(gap1)
  })

  test("uses linear backoff", async () => {
    let attempts = 0
    const startTimes: number[] = []

    await expect(
      retry(
        async () => {
          startTimes.push(Date.now())
          attempts++
          throw new Error("fail")
        },
        { times: 2, delayMs: 20, backoff: "linear" },
      ),
    ).rejects.toThrow()

    expect(attempts).toBe(3)
    const gap1 = startTimes[1]! - startTimes[0]!
    const gap2 = startTimes[2]! - startTimes[1]!
    expect(gap1).toBeGreaterThanOrEqual(15)
    expect(gap2).toBeGreaterThan(gap1)
  })

  test("uses constant delay by default", async () => {
    let attempts = 0
    const startTimes: number[] = []

    await expect(
      retry(
        async () => {
          startTimes.push(Date.now())
          attempts++
          throw new Error("fail")
        },
        { times: 2, delayMs: 20 },
      ),
    ).rejects.toThrow()

    expect(attempts).toBe(3)
    const gap1 = startTimes[1]! - startTimes[0]!
    const gap2 = startTimes[2]! - startTimes[1]!
    expect(gap1).toBeGreaterThanOrEqual(15)
    expect(gap2).toBeGreaterThanOrEqual(15)
    expect(Math.abs(gap2 - gap1)).toBeLessThan(15)
  })
})

describe("tryPromise with retry", () => {
  test("retries and eventually succeeds", async () => {
    let attempts = 0
    const result = await tryPromise(
      async () => {
        attempts++
        if (attempts < 2) throw new Error("not yet")
        return "done"
      },
      {
        catch: (e) => (e as Error).message,
        retry: { times: 3, delayMs: 1 },
      },
    )
    expect(result.ok).toBe(true)
    expect(result.ok && result.value).toBe("done")
    expect(attempts).toBe(2)
  })

  test("returns Err after all retries exhausted", async () => {
    let attempts = 0
    const result = await tryPromise(
      async () => {
        attempts++
        throw new Error("always fail")
      },
      {
        catch: (e) => (e as Error).message,
        retry: { times: 2, delayMs: 1 },
      },
    )
    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toBe("always fail")
    expect(attempts).toBe(3)
  })
})
