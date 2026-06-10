import type {
  ApiErrorHandler,
  ApiSuccessHandler,
} from "../types/ApiCallOptions";

import type {
  RuntimeRequestParams,
} from "../types/HttpResponse";

function isCallback(
  value: unknown,
): value is (...args: never[]) => unknown {
  return typeof value === "function";
}

function isRequestParams(
  value: unknown,
): value is RuntimeRequestParams {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

/**
 * Extracts wrapper arguments in this order:
 *
 * 1. Original API arguments
 * 2. Optional success callback
 * 3. Optional error callback
 * 4. Optional request params
 */
export function extractArgsCallbacksAndParams<
  TArgs extends unknown[],
  TResponse,
  TError = unknown,
>(
  argsWithCallbacks: [
    ...TArgs,
    ApiSuccessHandler<TResponse>?,
    ApiErrorHandler<TError>?,
    RuntimeRequestParams?,
  ],
): {
  args: TArgs;
  onSuccess?: ApiSuccessHandler<TResponse>;
  onError?: ApiErrorHandler<TError>;
  params?: RuntimeRequestParams;
} {
  const values = [...argsWithCallbacks] as unknown[];

  let onSuccess: ApiSuccessHandler<TResponse> | undefined;
  let onError: ApiErrorHandler<TError> | undefined;
  let params: RuntimeRequestParams | undefined;

  let lastArgument = values[values.length - 1];

  if (isRequestParams(lastArgument)) {
    params = lastArgument;
    values.pop();
  }

  lastArgument = values[values.length - 1];

  if (isCallback(lastArgument)) {
    onError = lastArgument as ApiErrorHandler<TError>;
    values.pop();
  }

  lastArgument = values[values.length - 1];

  if (isCallback(lastArgument)) {
    onSuccess = lastArgument as ApiSuccessHandler<TResponse>;
    values.pop();
  }

  return {
    args: values as TArgs,
    onSuccess,
    onError,
    params,
  };
}