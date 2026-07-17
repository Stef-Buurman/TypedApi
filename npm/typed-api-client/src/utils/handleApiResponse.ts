import type { ApiClientError, ApiHttpError, ApiHttpErrorBody, ApiResult } from "../interfaces/ApiResult";
import type { ApiErrorHandler, ApiSuccessHandler } from "../types/ApiCallOptions";
import type { HttpResponse } from "../httpClient";

const defaultUnknownErrorMessage = "An unknown error occurred.";

export type HandleApiResponseOptions<TResponse, TError = unknown> = {
  onSuccess?: ApiSuccessHandler<TResponse>;
  onError?: ApiErrorHandler<TResponse, TError>;
  transformResponse?: (value: unknown) => TResponse;
  transformError?: (value: unknown, response: Response) => TError;
  fallbackErrorMessage?: string;
};

class ResponseParseError extends Error {
  constructor(
    readonly status: number,
    readonly rawBody: string,
    readonly parseCause: unknown,
  ) {
    super(`Could not parse JSON response with status ${status}.`);
    this.name = "ResponseParseError";
  }
}

async function readResponseBody<T>(
  response: Response,
): Promise<T | string | Blob | undefined> {
  if (response.status === 204 || response.status === 205) return undefined;

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (
    contentType.includes("application/octet-stream") ||
    contentType.startsWith("image/") ||
    contentType.includes("application/pdf")
  ) {
    return response.blob();
  }

  const text = await response.text();
  if (!text) return undefined;

  if (contentType.includes("json") || contentType.includes("+json")) {
    try {
      return JSON.parse(text) as T;
    } catch (error) {
      throw new ResponseParseError(response.status, text, error);
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

export function createApiHttpError(status: number, body: unknown): ApiHttpError {
  return {
    kind: "http",
    status,
    body: body as ApiHttpErrorBody,
  };
}

function clientError(error: unknown, fallbackErrorMessage?: string): ApiClientError | string {
  if (error instanceof ResponseParseError) {
    return {
      kind: "parse",
      status: error.status,
      rawBody: error.rawBody,
      cause: error.parseCause,
    };
  }

  const name =
    typeof error === "object" && error !== null && "name" in error
      ? String((error as { name?: unknown }).name)
      : "";

  if (name === "AbortError" || name === "TimeoutError") {
    return { kind: "aborted", cause: error };
  }

  return fallbackErrorMessage ?? defaultUnknownErrorMessage;
}

export async function handleApiResponse<TResponse, TError = unknown>(
  call: () => Promise<HttpResponse<TResponse, TError>>,
  options?: HandleApiResponseOptions<TResponse, TError>,
): Promise<ApiResult<TResponse, TError>> {
  let result: ApiResult<TResponse, TError>;

  try {
    const response = await call();
    try {
      const rawData = await readResponseBody<unknown>(response.clone());
      const data = options?.transformResponse
        ? options.transformResponse(rawData)
        : rawData as TResponse;
      result = {
        ok: true,
        status: response.status,
        response: data,
      };
    } catch (error) {
      result = {
        ok: false,
        status: response.status,
        response: undefined,
        error: clientError(error, options?.fallbackErrorMessage),
      };
    }
  } catch (error) {
    if (isResponseLike(error)) {
      try {
        const rawErrorData = await readResponseBody<unknown>(error.clone());
        const transformedError = options?.transformError
          ? options.transformError(rawErrorData, error)
          : rawErrorData as TError;
        const errorData = transformedError === undefined
          ? options?.fallbackErrorMessage ?? defaultUnknownErrorMessage
          : transformedError;
        result = {
          ok: false,
          status: error.status,
          response: undefined,
          error: errorData,
        };
      } catch (parseError) {
        result = {
          ok: false,
          status: error.status,
          response: undefined,
          error: clientError(parseError, options?.fallbackErrorMessage),
        };
      }
    } else {
      result = {
        ok: false,
        status: 0,
        response: undefined,
        error: clientError(error, options?.fallbackErrorMessage),
      };
    }
  }

  // Consumer callbacks intentionally execute outside the request-catching block.
  // A callback exception is application code failure and should propagate to the caller.
  if (result.ok) await options?.onSuccess?.(result);
  else await options?.onError?.(result);

  return result;
}
