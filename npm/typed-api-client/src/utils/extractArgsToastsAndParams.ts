import type {
  ApiErrorHandler,
  ApiSuccessHandler,
} from "../types/ApiCallOptions";
import type { RuntimeRequestParams } from "../types/HttpResponse";

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
 * Extracts wrapper-only arguments in this order:
 * original API arguments, onSuccess, onError, request params.
 *
 * Kept for backwards compatibility with generated files that used toast-oriented naming.
 */
export function extractArgsToastsAndParams<
  TArgs extends readonly unknown[],
  TResponse,
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
    args: values as unknown as TArgs,
    onSuccess,
    onError,
    params,
  };
}
