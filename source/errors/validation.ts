class ValidationError {
  readonly _tag = "ValidationError" as const
  constructor(
    readonly messages: string[],
    readonly field?: string,
  ) {}
}

export { ValidationError }
