class NotFoundError {
  readonly _tag = "NotFoundError" as const
  constructor(
    readonly resource: string,
    readonly id?: string,
  ) {}
}

export { NotFoundError }
