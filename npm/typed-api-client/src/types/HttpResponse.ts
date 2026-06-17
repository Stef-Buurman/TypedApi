/**
 * Extended fetch response returned by the generated HTTP client.
 *
 * `data` contains the successful response body and `error` contains the error body when available.
 */
export interface HttpResponse<
  D extends unknown,
  E extends unknown = unknown,
> extends Response {
  data: D;
  error: E;
}

/**
 * Runtime request options that can be passed to generated API methods.
 *
 * Used for extra request configuration such as headers, query values, or fetch options.
 */
export type RuntimeRequestParams = Record<string, unknown>;
