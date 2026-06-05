export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

export type RuntimeRequestParams = Record<string, unknown>;