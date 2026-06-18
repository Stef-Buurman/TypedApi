import { ApiErrorHandler, ApiSuccessHandler } from "./ApiCallOptions";
import { RuntimeRequestParams } from "./HttpResponse";

export type ApiMethodOptions<
  TResponse,
  TError = unknown,
  TRequestParams = RuntimeRequestParams,
> = {
  onSuccess?: ApiSuccessHandler<TResponse>;
  onError?: ApiErrorHandler<TResponse, TError>;
  params?: TRequestParams;
};