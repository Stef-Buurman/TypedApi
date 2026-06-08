/**
 * Standard result wrapper for API calls.
 *
 * When `ok` is true, the request succeeded and `response` contains the expected data.
 * When `ok` is false, the request failed and `error` contains the thrown or returned error value.
 */
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