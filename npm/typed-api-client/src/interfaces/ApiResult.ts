export type ApiResult<T> =
  | {
      ok: true;
      status: number;
      response: T;
    }
  | {
      ok: false;
      status: number;
      response?: T;
      error: unknown;
    };