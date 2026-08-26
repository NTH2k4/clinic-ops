export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly requestId?: string,
    public readonly fields?: Record<string, string[]>,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}
