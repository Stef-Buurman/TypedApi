export type ApiHttpErrorBody =
  | string
  | number
  | boolean
  | null
  | Blob
  | undefined
  | ApiHttpErrorBody[]
  | { [key: string]: ApiHttpErrorBody };

/** An HTTP error response without a documented OpenAPI error schema. */
export type ApiHttpError = {
  kind: "http";
  status: number;
  body: ApiHttpErrorBody;
};

/** Errors created by the TypedApi runtime before a typed HTTP error body is available. */
export type ApiClientError =
  | {
      kind: "network";
      cause: unknown;
    }
  | {
      kind: "aborted";
      cause: unknown;
    }
  | {
      kind: "parse";
      status: number;
      rawBody: string;
      cause: unknown;
    };

/** Standard result wrapper returned by generated API wrapper methods. */
export type ApiResult<TResponse, TError = unknown> =
  | {
      ok: true;
      status: number;
      response: TResponse;
      error?: never;
    }
  | {
      ok: false;
      status: number;
      response?: undefined;
      error: TError | ApiClientError;
    };

export type ApiSuccessResult<TResponse, TError = unknown> = Extract<
  ApiResult<TResponse, TError>,
  { ok: true }
>;

export type ApiErrorResult<TResponse, TError = unknown> = Extract<
  ApiResult<TResponse, TError>,
  { ok: false }
>;
