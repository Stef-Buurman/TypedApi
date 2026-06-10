import type {
  ApiResult,
} from "../interfaces/ApiResult";

import type {
  ApiErrorHandler,
  ApiSuccessHandler,
} from "../types/ApiCallOptions";

import type {
  HttpResponse,
} from "../types/HttpResponse";

export type HandleApiResponseOptions<
  TResponse,
  TError = unknown,
> = {
  onSuccess?: ApiSuccessHandler<TResponse>;
  onError?: ApiErrorHandler<TError>;
};

async function readResponseBody<T>(
  response: Response,
): Promise<T | undefined> {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();

  if (!text) {
    return undefined;
  }

  const contentType =
    response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return JSON.parse(text) as T;
  }

  return text as T;
}

export async function handleApiResponse<
  TResponse,
  TError = unknown,
>(
  call: () => Promise<HttpResponse<TResponse, TError>>,
  options?: HandleApiResponseOptions<TResponse, TError>,
): Promise<ApiResult<TResponse>> {
  let response:
    | HttpResponse<TResponse, TError>
    | undefined;

  try {
    response = await call();

    const data =
      await readResponseBody<TResponse>(response);

    if (response.ok) {
      await options?.onSuccess?.(data as TResponse);

      return {
        ok: true,
        status: response.status,
        response: data as TResponse,
      };
    }

    const errorData =
      data as unknown as TError;

    await options?.onError?.(errorData);

    return {
      ok: false,
      status: response.status,
      response: data,
      error: errorData,
    };
  } catch (error) {
    await options?.onError?.(error as TError);

    return {
      ok: false,
      status:
        error instanceof Response
          ? error.status
          : response?.status ?? 0,
      response: undefined,
      error,
    };
  }
}