import type {
  ApiErrorHandler,
  ApiSuccessHandler,
} from "../types/a-piCallOptions";

import type { RuntimeRequestParams } from "../types/h-ttpResponse";

/**
 * Checks whether a value can be used as a generated wrapper callback.
 */
function isCallback(value: unknown): value is (...args: never[]) => unknown {
  return typeof value === "function";
}

/**
 * Checks whether a value is the optional request-params object accepted as the final wrapper argument.
 */
function isRequestParams(value: unknown): value is RuntimeRequestParams {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
  // Kept for backwards compatibility with generated files from older patches.
  // Error callbacks receive ApiErrorResult<TResponse>, whose `error` field is unknown.
  _TError = unknown,
>(
  argsWithCallbacks: [
    ...TArgs,
    ApiSuccessHandler<TResponse>?,
    ApiErrorHandler<TResponse>?,
    RuntimeRequestParams?,
  ],
): {
  args: TArgs;
  onSuccess?: ApiSuccessHandler<TResponse>;
  onError?: ApiErrorHandler<TResponse>;
  params?: RuntimeRequestParams;
} {
  const values = [...argsWithCallbacks] as unknown[];

  let onSuccess: ApiSuccessHandler<TResponse> | undefined;
  let onError: ApiErrorHandler<TResponse> | undefined;
  let params: RuntimeRequestParams | undefined;

  let lastArgument = values[values.length - 1];

  if (isRequestParams(lastArgument)) {
    params = lastArgument;
    values.pop();
  }

  lastArgument = values[values.length - 1];

  if (isCallback(lastArgument)) {
    onError = lastArgument as ApiErrorHandler<TResponse>;
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
