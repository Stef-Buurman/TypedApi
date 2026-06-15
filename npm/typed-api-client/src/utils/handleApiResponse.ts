import type { ApiResult } from "../interfaces/a-piResult";

import type {
  ApiErrorHandler,
  ApiSuccessHandler,
} from "../types/a-piCallOptions";

import type { HttpResponse } from "../types/h-ttpResponse";

/**
 * Optional callbacks used while converting a generated HTTP response into `ApiResult<TResponse>`.
 *
 * `onSuccess` is called with `ApiSuccessResult<TResponse>` and `onError` is called with `ApiErrorResult<TResponse>`.
 */
export type HandleApiResponseOptions<TResponse> = {
  onSuccess?: ApiSuccessHandler<TResponse>;
  onError?: ApiErrorHandler<TResponse>;
};

/**
 * Reads a fetch response body safely.
 *
 * Empty bodies and HTTP 204 responses return `undefined`; JSON responses are parsed and other responses are returned as text.
 */
async function readResponseBody<T>(response: Response): Promise<T | undefined> {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();

  if (!text) {
    return undefined;
  }

  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return JSON.parse(text) as T;
  }

  return text as T;
}

/**
 * Executes a generated API request and converts the result into `ApiResult<TResponse>`.
 *
 * Successful responses return `{ ok: true, status, response }`. Failed responses and thrown errors return `{ ok: false, status, error }`.
 */
export async function handleApiResponse<TResponse, TError>(
  call: () => Promise<HttpResponse<TResponse, TError>>,
  options?: HandleApiResponseOptions<TResponse>,
): Promise<ApiResult<TResponse>> {
  let response: HttpResponse<TResponse, TError> | undefined;

  try {
    response = await call();

    const data = await readResponseBody<TResponse>(response);

    if (response.ok) {
      const result: ApiResult<TResponse> = {
        ok: true,
        status: response.status,
        response: data as TResponse,
      };

      await options?.onSuccess?.(result);

      return result;
    }

    const errorData = data as unknown as TError;

    const result: ApiResult<TResponse> = {
      ok: false,
      status: response.status,
      response: data,
      error: errorData,
    };

    await options?.onError?.(result);

    return result;
  } catch (error) {
    const result: ApiResult<TResponse> = {
      ok: false,
      status:
        error instanceof Response ? error.status : (response?.status ?? 0),
      response: undefined,
      error,
    };

    await options?.onError?.(result);

    return result;
  }
}
