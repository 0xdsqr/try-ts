class NetworkError {
  readonly _tag = "NetworkError" as const
  constructor(
    readonly cause: unknown,
    readonly url?: string,
  ) {}
}

export { NetworkError }
