import type { ApiErrorResult, ApiSuccessResult } from "typedapi-client-helpers";

export function handleGoodResult<T>(
  _response: ApiSuccessResult<T>,
): void | Promise<void> {
  console.log("API call succeeded:", _response);
}

export function handleErrors<T>(
  _error: ApiErrorResult<T>,
): void | Promise<void> {
  console.error("API call failed:", _error);
}

export const unknownErrorMessage = "An unknown error occurred.";
