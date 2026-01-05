class TimeoutError {
  readonly _tag = "TimeoutError" as const
  constructor(
    readonly operation: string,
    readonly timeoutMs: number,
  ) {}
}

export { TimeoutError }
