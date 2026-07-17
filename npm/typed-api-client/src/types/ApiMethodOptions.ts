import type { ApiErrorHandler, ApiSuccessHandler } from "./ApiCallOptions";
import type { RuntimeRequestParams } from "./httpClientTypes";

export type ApiMethodOptions<
  TResponse,
  TError = unknown,
  TRequestParams = RuntimeRequestParams,
> = {
  onSuccess?: ApiSuccessHandler<TResponse>;
  onError?: ApiErrorHandler<TResponse, TError>;
  params?: TRequestParams;
};