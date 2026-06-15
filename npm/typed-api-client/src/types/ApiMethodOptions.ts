import { ApiErrorHandler, ApiSuccessHandler } from "./ApiCallOptions";
import { ExtractError, ExtractResponse } from "./ApiMethodTypes";
import { RuntimeRequestParams } from "./HttpResponse";

export type ApiMethodOptions<
  TMethodReturn,
  TRequestParams = RuntimeRequestParams,
> = {
  onSuccess?: ApiSuccessHandler<ExtractResponse<TMethodReturn>>;
  onError?: ApiErrorHandler<ExtractError<TMethodReturn>>;
  params?: TRequestParams;
};