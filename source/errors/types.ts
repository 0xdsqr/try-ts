import type { HttpError } from "./http.ts"
import type { NetworkError } from "./network.ts"
import type { NotFoundError } from "./not-found.ts"
import type { ParseError } from "./parse.ts"
import type { TimeoutError } from "./timeout.ts"
import type { ValidationError } from "./validation.ts"

type CommonError =
  | NetworkError
  | HttpError
  | ValidationError
  | NotFoundError
  | ParseError
  | TimeoutError

function matchError<T>(
  error: CommonError,
  handlers: {
    NetworkError: (e: NetworkError) => T
    HttpError: (e: HttpError) => T
    ValidationError: (e: ValidationError) => T
    NotFoundError: (e: NotFoundError) => T
    ParseError: (e: ParseError) => T
    TimeoutError: (e: TimeoutError) => T
  },
): T {
  switch (error._tag) {
    case "NetworkError":
      return handlers.NetworkError(error)
    case "HttpError":
      return handlers.HttpError(error)
    case "ValidationError":
      return handlers.ValidationError(error)
    case "NotFoundError":
      return handlers.NotFoundError(error)
    case "ParseError":
      return handlers.ParseError(error)
    case "TimeoutError":
      return handlers.TimeoutError(error)
  }
}

export { type CommonError, matchError }
