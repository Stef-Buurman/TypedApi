import type { ApiResult } from "../interfaces/ApiResult";

import type {
  ApiErrorHandler,
  ApiSuccessHandler,
} from "../types/ApiCallOptions";

import type { HttpResponse } from "../httpClient";

export type HandleApiResponseOptions<TResponse, TError = unknown> = {
  onSuccess?: ApiSuccessHandler<TResponse>;
  onError?: ApiErrorHandler<TResponse, TError>;
};

async function readResponseBody<T>(
  response: Response,
): Promise<T | string | Blob | undefined> {
  if (response.status === 204 || response.status === 205) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/octet-stream")) {
    return response.blob();
  }

  const text = await response.text();

  if (!text) {
    return undefined;
  }

  if (contentType.includes("json") || contentType.includes("+json")) {
    try {
      return JSON.parse(text) as T;
    } catch {
      return text;
    }
  }

  return text;
}

function isResponseLike(value: unknown): value is Response {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "ok" in value &&
    "headers" in value &&
    typeof (value as Response).text === "function"
  );
}

export async function handleApiResponse<TResponse, TError = unknown>(
  call: () => Promise<HttpResponse<TResponse, TError>>,
  options?: HandleApiResponseOptions<TResponse, TError>,
): Promise<ApiResult<TResponse, TError>> {
  let response: HttpResponse<TResponse, TError> | undefined;

  try {
    response = await call();

    const data = await readResponseBody<TResponse>(response.clone());

    const result: ApiResult<TResponse, TError> = {
      ok: true,
      status: response.status,
      response: data as TResponse,
    };

    await options?.onSuccess?.(result);

    return result;
  } catch (error) {
    if (isResponseLike(error)) {
      const errorData = await readResponseBody<TError>(error.clone());

      const result: ApiResult<TResponse, TError> = {
        ok: false,
        status: error.status,
        response: undefined,
        error: errorData as TError,
      };

      await options?.onError?.(result);

      return result;
    }

    const result: ApiResult<TResponse, TError> = {
      ok: false,
      status: response?.status ?? 0,
      response: undefined,
      error: error as TError,
    };

    await options?.onError?.(result);

    return result;
  }
}