export type QueryParamsType = object;

export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export type CancelToken = symbol | string | number;

export const ContentType = {
  Json: "application/json",
  JsonApi: "application/vnd.api+json",
  FormData: "multipart/form-data",
  UrlEncoded: "application/x-www-form-urlencoded",
  Text: "text/plain",
} as const;

export type ContentType = (typeof ContentType)[keyof typeof ContentType];

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  secure?: boolean;
  path: string;
  type?: ContentType;
  query?: QueryParamsType;
  format?: ResponseFormat;
  body?: unknown;
  baseUrl?: string;
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export type RuntimeRequestParams = RequestParams;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<
  D extends unknown,
  E extends unknown = unknown,
> extends Response {
  data: D;
  error: E;
}

type RuntimeApiState<SecurityDataType = unknown> = {
  baseUrl: string;
  securityData: SecurityDataType | null;
  securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  customFetch: typeof fetch;
  baseApiParams: RequestParams;
  abortControllers: Map<CancelToken, AbortController>;
};

export function createApiClient<SecurityDataType = unknown>(
  apiConfig: ApiConfig<SecurityDataType> = {},
) {
  const state: RuntimeApiState<SecurityDataType> = {
    baseUrl: apiConfig.baseUrl ?? "",
    securityData: null,
    securityWorker: apiConfig.securityWorker,
    customFetch:
      apiConfig.customFetch ?? ((...fetchParams) => fetch(...fetchParams)),
    baseApiParams: {
      credentials: "same-origin",
      headers: {},
      redirect: "follow",
      referrerPolicy: "no-referrer",
      ...(apiConfig.baseApiParams ?? {}),
    },
    abortControllers: new Map<CancelToken, AbortController>(),
  };

  function configureApiClient(
    nextConfig: ApiConfig<SecurityDataType> = {},
  ): void {
    if (typeof nextConfig.baseUrl === "string") {
      state.baseUrl = nextConfig.baseUrl;
    }

    if (nextConfig.securityWorker) {
      state.securityWorker = nextConfig.securityWorker;
    }

    if (nextConfig.customFetch) {
      state.customFetch = nextConfig.customFetch;
    }

    if (nextConfig.baseApiParams) {
      state.baseApiParams = mergeRequestParams(
        state.baseApiParams,
        nextConfig.baseApiParams,
      );
    }
  }

  function setSecurityData(data: SecurityDataType | null): void {
    state.securityData = data;
  }

  function encodeQueryParam(key: string, value: unknown): string {
    const encodedKey = encodeURIComponent(key);

    const normalizedValue = value instanceof Date ? value.toISOString() : value;

    return `${encodedKey}=${encodeURIComponent(String(normalizedValue))}`;
  }

  function addArrayQueryParam(key: string, value: unknown[]): string {
    return value.map((item) => encodeQueryParam(key, item)).join("&");
  }

  function toQueryString(rawQuery?: QueryParamsType): string {
    if (!rawQuery) {
      return "";
    }

    return Object.entries(rawQuery as Record<string, unknown>)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) =>
        Array.isArray(value)
          ? addArrayQueryParam(key, value)
          : encodeQueryParam(key, value),
      )
      .join("&");
  }

  function contentFormatter(
    type: ContentType | undefined,
    input: unknown,
  ): BodyInit | null {
    if (input === undefined || input === null) {
      return null;
    }

    if (
      input instanceof FormData ||
      input instanceof Blob ||
      typeof input === "string"
    ) {
      return input;
    }

    switch (type ?? ContentType.Json) {
      case ContentType.Json:
      case ContentType.JsonApi:
        return typeof input === "object" || typeof input === "string"
          ? JSON.stringify(input)
          : String(input);

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
    if (input instanceof FormData) {
      return input;
    }

    const formData = new FormData();

    for (const [key, value] of Object.entries(
      (input ?? {}) as Record<string, unknown>,
    )) {
      appendFormDataValue(formData, key, value);
    }

    return formData;
  }

  function appendFormDataValue(
    formData: FormData,
    key: string,
    value: unknown,
  ): void {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        appendFormDataValue(formData, key, item);
      }

      return;
    }

    if (value instanceof File) {
      formData.append(key, value, value.name);
      return;
    }

    if (value instanceof Blob) {
      formData.append(key, value);
      return;
    }

    if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
      return;
    }

    formData.append(key, String(value));
  }

  function mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...params1,
      ...(params2 ?? {}),
      headers: {
        ...(params1.headers ?? {}),
        ...(params2?.headers ?? {}),
      },
    };
  }

  function createAbortSignal(cancelToken: CancelToken): AbortSignal {
    const existingAbortController = state.abortControllers.get(cancelToken);

    if (existingAbortController) {
      return existingAbortController.signal;
    }

    const abortController = new AbortController();
    state.abortControllers.set(cancelToken, abortController);

    return abortController.signal;
  }

  function abortRequest(cancelToken: CancelToken): void {
    const abortController = state.abortControllers.get(cancelToken);

    if (!abortController) {
      return;
    }

    abortController.abort();
    state.abortControllers.delete(cancelToken);
  }

  async function request<T = unknown, E = unknown>({
    body,
    secure,
    path,
    type,
    query,
    baseUrl,
    cancelToken,
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
    const url = `${baseUrl ?? state.baseUrl}${path}${
      queryString ? `?${queryString}` : ""
    }`;

    const requestInit: RequestInit = {
      ...requestParams,
      headers: {
        ...(requestParams.headers ?? {}),
        ...(type && type !== ContentType.FormData
          ? { "Content-Type": type }
          : {}),
      },
      signal: cancelToken
        ? createAbortSignal(cancelToken)
        : requestParams.signal,
    };

    if (body !== undefined && body !== null) {
      requestInit.body = contentFormatter(type, body);
    }

    const response = await state.customFetch(url, requestInit);
    const typedResponse = response as HttpResponse<T, E>;

    typedResponse.data = null as T;
    typedResponse.error = null as E;

    if (cancelToken) {
      state.abortControllers.delete(cancelToken);
    }

    if (!response.ok) {
      throw typedResponse;
    }

    return typedResponse;
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
