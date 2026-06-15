import type {
  RequestParams,
} from "./httpClientTypes";

import type {
  ApiErrorResult,
  ApiSuccessResult,
} from "../interfaces/ApiResult";

export type ApiSuccessHandler<TResponse> = (
  result: ApiSuccessResult<TResponse>,
) => void | Promise<void>;

export type ApiErrorHandler<TResponse> = (
  result: ApiErrorResult<TResponse>,
) => void | Promise<void>;

export type ApiMethodCallbacks<TResponse> = {
  onSuccess?: ApiSuccessHandler<TResponse>;
  onError?: ApiErrorHandler<TResponse>;
  params?: RequestParams;
};
