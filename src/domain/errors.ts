export class StationUnavailableError extends Error {
  constructor(
    readonly station: string,
    options?: ErrorOptions,
  ) {
    super(`${station} is unavailable`, options);
    this.name = 'StationUnavailableError';
  }
}

export class NotImplementedError extends Error {
  constructor(readonly operation: string) {
    super(`${operation} is not implemented yet`);
    this.name = 'NotImplementedError';
  }
}
