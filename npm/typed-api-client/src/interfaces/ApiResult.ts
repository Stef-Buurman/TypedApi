/**
 * Standard result wrapper returned by generated API wrapper methods.
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

/**
 * Narrowed success branch of `ApiResult<T>`.
 *
 * Use this type for success callbacks or helper functions that should only receive successful API results.
 */
export type ApiSuccessResult<T> = Extract<ApiResult<T>, { ok: true }>;

/**
 * Narrowed error branch of `ApiResult<T>`.
 *
 * Use this type for error callbacks or helper functions that should only receive failed API results.
 */
export type ApiErrorResult<T> = Extract<ApiResult<T>, { ok: false }>;
