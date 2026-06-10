import type {
  RequestParams,
} from "../api/generated/http-client";

export type ApiSuccessHandler<TResponse> = (
  response: TResponse,
) => void | Promise<void>;

export type ApiErrorHandler<TError = unknown> = (
  error: TError,
) => void | Promise<void>;

export type ApiMethodCallbacks<TResponse, TError = unknown> = {
  onSuccess?: ApiSuccessHandler<TResponse>;
  onError?: ApiErrorHandler<TError>;
  params?: RequestParams;
};