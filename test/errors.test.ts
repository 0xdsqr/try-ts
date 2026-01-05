import { describe, expect, test } from "bun:test"
import {
  type CommonError,
  HttpError,
  matchError,
  NetworkError,
  NotFoundError,
  ParseError,
  TimeoutError,
  ValidationError,
} from "../source/errors/index.ts"

describe("NetworkError", () => {
  test("creates with cause only", () => {
    const error = new NetworkError(new Error("connection refused"))
    expect(error._tag).toBe("NetworkError")
    expect(error.cause).toBeInstanceOf(Error)
    expect(error.url).toBeUndefined()
  })

  test("creates with cause and url", () => {
    const error = new NetworkError("timeout", "https://api.example.com")
    expect(error._tag).toBe("NetworkError")
    expect(error.cause).toBe("timeout")
    expect(error.url).toBe("https://api.example.com")
  })
})

describe("HttpError", () => {
  test("creates with all fields", () => {
    const error = new HttpError(
      404,
      "Not Found",
      "https://api.example.com/users/1",
    )
    expect(error._tag).toBe("HttpError")
    expect(error.status).toBe(404)
    expect(error.statusText).toBe("Not Found")
    expect(error.url).toBe("https://api.example.com/users/1")
  })

  test("works with different status codes", () => {
    expect(new HttpError(500, "Internal Server Error", "/api").status).toBe(500)
    expect(new HttpError(401, "Unauthorized", "/api").status).toBe(401)
    expect(new HttpError(403, "Forbidden", "/api").status).toBe(403)
  })
})

describe("ValidationError", () => {
  test("creates with messages only", () => {
    const error = new ValidationError(["field is required"])
    expect(error._tag).toBe("ValidationError")
    expect(error.messages).toEqual(["field is required"])
    expect(error.field).toBeUndefined()
  })

  test("creates with messages and field", () => {
    const error = new ValidationError(
      ["must be positive", "must be integer"],
      "age",
    )
    expect(error._tag).toBe("ValidationError")
    expect(error.messages).toEqual(["must be positive", "must be integer"])
    expect(error.field).toBe("age")
  })

  test("handles empty messages array", () => {
    const error = new ValidationError([])
    expect(error.messages).toEqual([])
  })
})

describe("ParseError", () => {
  test("creates with cause only", () => {
    const error = new ParseError(new SyntaxError("Unexpected token"))
    expect(error._tag).toBe("ParseError")
    expect(error.cause).toBeInstanceOf(SyntaxError)
    expect(error.input).toBeUndefined()
  })

  test("creates with cause and input", () => {
    const error = new ParseError("invalid", "{malformed json}")
    expect(error._tag).toBe("ParseError")
    expect(error.cause).toBe("invalid")
    expect(error.input).toBe("{malformed json}")
  })
})

describe("NotFoundError", () => {
  test("creates with resource only", () => {
    const error = new NotFoundError("User")
    expect(error._tag).toBe("NotFoundError")
    expect(error.resource).toBe("User")
    expect(error.id).toBeUndefined()
  })

  test("creates with resource and id", () => {
    const error = new NotFoundError("User", "123")
    expect(error._tag).toBe("NotFoundError")
    expect(error.resource).toBe("User")
    expect(error.id).toBe("123")
  })
})

describe("TimeoutError", () => {
  test("creates with operation and timeout", () => {
    const error = new TimeoutError("database query", 5000)
    expect(error._tag).toBe("TimeoutError")
    expect(error.operation).toBe("database query")
    expect(error.timeoutMs).toBe(5000)
  })
})

describe("matchError", () => {
  const createHandler = () => ({
    NetworkError: (e: NetworkError) => `network: ${e.url ?? "unknown"}`,
    HttpError: (e: HttpError) => `http: ${e.status}`,
    ValidationError: (e: ValidationError) =>
      `validation: ${e.messages.join(", ")}`,
    NotFoundError: (e: NotFoundError) => `not found: ${e.resource}`,
    ParseError: () => `parse error`,
    TimeoutError: (e: TimeoutError) => `timeout: ${e.operation}`,
  })

  test("matches NetworkError", () => {
    const error: CommonError = new NetworkError("fail", "https://api.com")
    expect(matchError(error, createHandler())).toBe("network: https://api.com")
  })

  test("matches HttpError", () => {
    const error: CommonError = new HttpError(500, "Error", "/api")
    expect(matchError(error, createHandler())).toBe("http: 500")
  })

  test("matches ValidationError", () => {
    const error: CommonError = new ValidationError(["required", "too short"])
    expect(matchError(error, createHandler())).toBe(
      "validation: required, too short",
    )
  })

  test("matches NotFoundError", () => {
    const error: CommonError = new NotFoundError("Post", "42")
    expect(matchError(error, createHandler())).toBe("not found: Post")
  })

  test("matches ParseError", () => {
    const error: CommonError = new ParseError("bad json")
    expect(matchError(error, createHandler())).toBe("parse error")
  })

  test("matches TimeoutError", () => {
    const error: CommonError = new TimeoutError("fetch", 3000)
    expect(matchError(error, createHandler())).toBe("timeout: fetch")
  })

  test("returns correct type from handlers", () => {
    const error: CommonError = new HttpError(404, "Not Found", "/api")
    const result = matchError(error, {
      NetworkError: () => 0,
      HttpError: (e) => e.status,
      ValidationError: () => 0,
      NotFoundError: () => 0,
      ParseError: () => 0,
      TimeoutError: () => 0,
    })
    expect(result).toBe(404)
  })
})
