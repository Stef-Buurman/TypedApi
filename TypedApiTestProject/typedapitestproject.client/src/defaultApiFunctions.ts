import type { ApiErrorResult, ApiSuccessResult } from "typedapi-client-helpers";

export function handleGoodResult<T>(
  _response: ApiSuccessResult<T>,
): void | Promise<void> {
  console.log("Default success handler:", _response);
}

export function handleErrors<T>(
  _error: ApiErrorResult<T>,
): void | Promise<void> {
  console.error("Default error handler:", _error);
}
