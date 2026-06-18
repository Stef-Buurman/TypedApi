/**
 * Standard result wrapper returned by generated API wrapper methods.
 *
 * When `ok` is true, the request succeeded and `response` contains the expected data.
 * When `ok` is false, the request failed and `error` contains the thrown or returned error value.
 */
export type ApiResult<TResponse, TError = unknown> =
  | {
      ok: true;
      status: number;
      response: TResponse;
      error?: never;
    }
  | {
      ok: false;
      status: number;
      response?: undefined;
      error: TError;
    };

/**
 * Narrowed success branch of `ApiResult<T>`.
 *
 * Use this type for success callbacks or helper functions that should only receive successful API results.
 */
export type ApiSuccessResult<TResponse, TError = unknown> = Extract<
  ApiResult<TResponse, TError>,
  { ok: true }
>;

/**
 * Narrowed error branch of `ApiResult<T>`.
 *
 * Use this type for error callbacks or helper functions that should only receive failed API results.
 */
export type ApiErrorResult<TResponse, TError = unknown> = Extract<
  ApiResult<TResponse, TError>,
  { ok: false }
>;
