# try-ts

## 0.1.0

### Minor Changes

- Initial release of try-ts - Rust-style error handling for TypeScript.

  - Result type with `ok()` and `err()` constructors
  - Generator-based do-notation with `gen`, `genAsync`, `unwrap`, `awaitResult`
  - Error boundaries with `trySync` and `tryPromise` (with retry support)
  - Collection utilities: `collect`, `collectAsync`
  - Built-in error types: `NetworkError`, `HttpError`, `ValidationError`, `ParseError`, `NotFoundError`, `TimeoutError`
  - Pattern matching with `match` and `matchError`
