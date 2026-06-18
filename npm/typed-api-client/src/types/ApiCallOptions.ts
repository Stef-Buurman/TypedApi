import type { RequestParams } from "./httpClientTypes";

import type { ApiErrorResult, ApiSuccessResult } from "../interfaces/ApiResult";

/**
 * Function called after a generated wrapper method receives a successful API result.
 *
 * The callback receives the success-only branch of `ApiResult<TResponse>`.
 */
export type ApiSuccessHandler<TResponse> = (
  result: ApiSuccessResult<TResponse>,
) => void | Promise<void>;

/**
 * Function called after a generated wrapper method receives a failed API result.
 *
 * The callback receives the error-only branch of `ApiResult<TResponse>`.
 */
export type ApiErrorHandler<TResponse, TError = unknown> = (
  result: ApiErrorResult<TResponse, TError>,
) => void | Promise<void>;

/**
 * Optional callback and request-parameter object accepted by generated API wrapper methods.
 *
 * `onSuccess` runs for successful responses, `onError` runs for failed responses,
 * and `params` is forwarded to the generated HTTP client.
 */
export type ApiMethodCallbacks<
  TResponse,
  TError = unknown,
  TRequestParams = RequestParams,
> = {
  onSuccess?: ApiSuccessHandler<TResponse>;
  onError?: ApiErrorHandler<TResponse, TError>;
  params?: TRequestParams;
};
