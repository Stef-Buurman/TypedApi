import type {
  HttpResponse,
  RequestParams,
} from "./httpClientTypes";

export type ExtractResponse<T> =
  T extends Promise<HttpResponse<infer Response, unknown>>
    ? Response
    : never;

export type ExtractError<T> =
  T extends Promise<HttpResponse<unknown, infer Error>>
    ? Error
    : never;

export type UnwrapArray<T> =
  T extends readonly (infer Item)[]
    ? Item
    : T;

export type ExtractDataIfPaginated<T> =
  T extends { data?: readonly (infer Item)[] | null }
    ? Item
    : T;

export type SortableKeys<T> =
  keyof UnwrapArray<ExtractDataIfPaginated<T>>;

/**
 * Removes the optional RequestParams argument from the end
 * of a generated API method parameter tuple.
 *
 * Example:
 *
 * [data: CreateSupplierParams, params?: RequestParams]
 *
 * becomes:
 *
 * [data: CreateSupplierParams]
 */
export type WithoutRequestParams<
  T extends readonly unknown[],
> =
  T extends readonly [
    ...infer Arguments,
    RequestParams?,
  ]
    ? Arguments
    : T;