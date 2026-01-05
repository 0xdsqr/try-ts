class HttpError {
  readonly _tag = "HttpError" as const
  constructor(
    readonly status: number,
    readonly statusText: string,
    readonly url: string,
  ) {}
}

export { HttpError }
