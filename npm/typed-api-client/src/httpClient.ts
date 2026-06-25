export type QueryParamsType = object;

export type ResponseFormat = "arrayBuffer" | "blob" | "formData" | "json" | "text";

export type CancelToken = symbol | string | number;

export const ContentType = {
  Json: "application/json",
  JsonApi: "application/vnd.api+json",
  FormData: "multipart/form-data",
  UrlEncoded: "application/x-www-form-urlencoded",
  Text: "text/plain",
} as const;

export type ContentType = (typeof ContentType)[keyof typeof ContentType];

export interface FullRequestParams extends Omit<RequestInit, "body" | "headers" | "signal"> {
  secure?: boolean;
  path: string;
  type?: ContentType;
  query?: QueryParamsType;
  format?: ResponseFormat;
  body?: unknown;
  baseUrl?: string;
  cancelToken?: CancelToken;
  headers?: HeadersInit;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;
export type RuntimeRequestParams = RequestParams;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
  timeoutMs?: number;
}

declare const responseDataType: unique symbol;
declare const responseErrorType: unique symbol;

/** A native Response carrying compile-time-only body and error types. */
export type HttpResponse<D = unknown, E = unknown> = Response & {
  readonly [responseDataType]?: D;
  readonly [responseErrorType]?: E;
};

type RuntimeApiState<SecurityDataType = unknown> = {
  baseUrl: string;
  securityData: SecurityDataType | null;
  securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  customFetch: typeof fetch;
  baseApiParams: RequestParams;
  timeoutMs?: number;
  abortControllers: Map<CancelToken, AbortController>;
};

export function mergeHeaders(...sources: Array<HeadersInit | undefined>): Headers {
  const result = new Headers();
  for (const source of sources) {
    if (!source) continue;
    const headers = new Headers(source);
    headers.forEach((value, key) => result.set(key, value));
  }
  return result;
}

export function toRequestHeaders(values?: object): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(values ?? {})) {
    if (value === undefined || value === null) continue;
    const normalized = Array.isArray(value)
      ? value.map(normalizeScalar).join(", ")
      : normalizeScalar(value);
    headers.set(key, normalized);
  }
  return headers;
}

export function toCookieHeader(values: object): string {
  return Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(normalizeScalar(value))}`)
    .join("; ");
}

function normalizeScalar(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function isBlob(value: unknown): value is Blob {
  return typeof Blob !== "undefined" && value instanceof Blob;
}

function isFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

export function createApiClient<SecurityDataType = unknown>(
  apiConfig: ApiConfig<SecurityDataType> = {},
) {
  const state: RuntimeApiState<SecurityDataType> = {
    baseUrl: apiConfig.baseUrl ?? "",
    securityData: null,
    securityWorker: apiConfig.securityWorker,
    customFetch: apiConfig.customFetch ?? ((...fetchParams) => fetch(...fetchParams)),
    baseApiParams: {
      credentials: "same-origin",
      headers: {},
      redirect: "follow",
      referrerPolicy: "no-referrer",
      ...(apiConfig.baseApiParams ?? {}),
    },
    timeoutMs: apiConfig.timeoutMs,
    abortControllers: new Map<CancelToken, AbortController>(),
  };

  function configureApiClient(nextConfig: ApiConfig<SecurityDataType> = {}): void {
    if (typeof nextConfig.baseUrl === "string") state.baseUrl = nextConfig.baseUrl;
    if (nextConfig.securityWorker) state.securityWorker = nextConfig.securityWorker;
    if (nextConfig.customFetch) state.customFetch = nextConfig.customFetch;
    if (nextConfig.timeoutMs !== undefined) state.timeoutMs = nextConfig.timeoutMs;
    if (nextConfig.baseApiParams) {
      state.baseApiParams = mergeRequestParams(state.baseApiParams, nextConfig.baseApiParams);
    }
  }

  function setSecurityData(data: SecurityDataType | null): void {
    state.securityData = data;
  }

  function encodeQueryParam(key: string, value: unknown): string {
    return `${encodeURIComponent(key)}=${encodeURIComponent(normalizeScalar(value))}`;
  }

  function toQueryString(rawQuery?: QueryParamsType): string {
    if (!rawQuery) return "";
    return Object.entries(rawQuery as Record<string, unknown>)
      .filter(([, value]) => value !== undefined && value !== null)
      .flatMap(([key, value]) =>
        Array.isArray(value)
          ? value.map((item) => encodeQueryParam(key, item))
          : [encodeQueryParam(key, value)],
      )
      .join("&");
  }

  function contentFormatter(type: ContentType | undefined, input: unknown): BodyInit | null {
    if (input === undefined || input === null) return null;
    if (isFormData(input) || isBlob(input)) return input;

    switch (type ?? ContentType.Json) {
      case ContentType.Json:
      case ContentType.JsonApi:
        return JSON.stringify(input);
      case ContentType.Text:
        return typeof input === "string" ? input : JSON.stringify(input);
      case ContentType.FormData:
        return toFormData(input);
      case ContentType.UrlEncoded:
        return toQueryString(input as QueryParamsType);
      default:
        return input as BodyInit;
    }
  }

  function toFormData(input: unknown): FormData {
    if (isFormData(input)) return input;
    if (typeof FormData === "undefined") {
      throw new Error("FormData is not available in this runtime. Provide a FormData polyfill or custom body.");
    }

    const formData = new FormData();
    for (const [key, value] of Object.entries((input ?? {}) as Record<string, unknown>)) {
      appendFormDataValue(formData, key, value);
    }
    return formData;
  }

  function appendFormDataValue(formData: FormData, key: string, value: unknown): void {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      for (const item of value) appendFormDataValue(formData, key, item);
      return;
    }
    if (isFile(value)) {
      formData.append(key, value, value.name);
      return;
    }
    if (isBlob(value)) {
      formData.append(key, value);
      return;
    }
    if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
      return;
    }
    formData.append(key, String(value));
  }

  function mergeRequestParams(params1: RequestParams, params2?: RequestParams): RequestParams {
    return {
      ...params1,
      ...(params2 ?? {}),
      headers: mergeHeaders(params1.headers, params2?.headers),
    };
  }

  function createAbortSignal(cancelToken: CancelToken): AbortSignal {
    const existing = state.abortControllers.get(cancelToken);
    if (existing) return existing.signal;
    const controller = new AbortController();
    state.abortControllers.set(cancelToken, controller);
    return controller.signal;
  }

  function abortRequest(cancelToken: CancelToken): void {
    const controller = state.abortControllers.get(cancelToken);
    if (!controller) return;
    controller.abort();
    state.abortControllers.delete(cancelToken);
  }

  function combineSignals(signals: Array<AbortSignal | undefined>): {
    signal?: AbortSignal;
    cleanup: () => void;
  } {
    const active = signals.filter((signal): signal is AbortSignal => Boolean(signal));
    if (active.length === 0) return { signal: undefined, cleanup: () => undefined };
    if (active.length === 1) return { signal: active[0], cleanup: () => undefined };

    const controller = new AbortController();
    const listeners: Array<() => void> = [];
    const abort = (signal: AbortSignal) => {
      if (!controller.signal.aborted) controller.abort(signal.reason);
    };

    for (const signal of active) {
      if (signal.aborted) {
        abort(signal);
        break;
      }
      const listener = () => abort(signal);
      signal.addEventListener("abort", listener, { once: true });
      listeners.push(() => signal.removeEventListener("abort", listener));
    }

    return {
      signal: controller.signal,
      cleanup: () => listeners.forEach((remove) => remove()),
    };
  }

  function buildUrl(baseUrl: string, requestPath: string, queryString: string): string {
    const pathValue = /^https?:\/\//i.test(requestPath)
      ? requestPath
      : `${baseUrl.replace(/\/$/, "")}/${requestPath.replace(/^\//, "")}`;
    if (!queryString) return pathValue;
    return `${pathValue}${pathValue.includes("?") ? "&" : "?"}${queryString}`;
  }

  async function request<T = unknown, E = unknown>({
    body,
    secure,
    path,
    type,
    query,
    format: _format,
    baseUrl,
    cancelToken,
    timeoutMs,
    signal: requestSignal,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> {
    const secureParams =
      ((typeof secure === "boolean" ? secure : state.baseApiParams.secure) &&
        state.securityWorker &&
        (await state.securityWorker(state.securityData))) ||
      {};

    const requestParams = mergeRequestParams(
      mergeRequestParams(state.baseApiParams, params),
      secureParams,
    );

    const queryString = query ? toQueryString(query) : "";
    const url = buildUrl(baseUrl ?? state.baseUrl, path, queryString);
    const timeout = timeoutMs ?? state.timeoutMs;
    const timeoutController = timeout && timeout > 0 ? new AbortController() : undefined;
    const timeoutHandle = timeoutController
      ? setTimeout(() => timeoutController.abort(new DOMException("Request timed out", "TimeoutError")), timeout)
      : undefined;
    const tokenSignal = cancelToken !== undefined ? createAbortSignal(cancelToken) : undefined;
    const combined = combineSignals([requestSignal, requestParams.signal, tokenSignal, timeoutController?.signal]);

    const requestInit: RequestInit = {
      ...requestParams,
      headers: mergeHeaders(
        requestParams.headers,
        type && type !== ContentType.FormData ? { "Content-Type": type } : undefined,
      ),
      signal: combined.signal,
    };

    if (body !== undefined && body !== null) requestInit.body = contentFormatter(type, body);

    try {
      const response = await state.customFetch(url, requestInit);
      if (!response.ok) throw response as HttpResponse<T, E>;
      return response as HttpResponse<T, E>;
    } finally {
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
      combined.cleanup();
      if (cancelToken !== undefined) state.abortControllers.delete(cancelToken);
    }
  }

  return {
    configureApiClient,
    setSecurityData,
    abortRequest,
    request,
    toQueryString,
  };
}

export const defaultApiClient = createApiClient();
export const configureApiClient = defaultApiClient.configureApiClient;
export const setSecurityData = defaultApiClient.setSecurityData;
export const abortRequest = defaultApiClient.abortRequest;
export const request = defaultApiClient.request;
