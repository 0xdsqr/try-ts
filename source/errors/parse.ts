class ParseError {
  readonly _tag = "ParseError" as const
  constructor(
    readonly cause: unknown,
    readonly input?: string,
  ) {}
}

export { ParseError }
