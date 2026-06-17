import type { HttpResponse, RequestParams } from "./httpClientTypes";

/**
 * Extracts the successful response body type from a generated API method promise.
 *
 * Example: `Promise<HttpResponse<Product, Error>>` becomes `Product`.
 */
export type ExtractResponse<T> =
  T extends Promise<HttpResponse<infer Response, unknown>> ? Response : never;

/**
 * Extracts the error response body type from a generated API method promise.
 *
 * Example: `Promise<HttpResponse<Product, ApiError>>` becomes `ApiError`.
 */
export type ExtractError<T> =
  T extends Promise<HttpResponse<unknown, infer Error>> ? Error : never;

/**
 * Extracts the item type from an array, otherwise returns the original type.
 *
 * Example: `Product[]` becomes `Product`, while `Product` stays `Product`.
 */
export type UnwrapArray<T> = T extends readonly (infer Item)[] ? Item : T;

/**
 * Extracts the item type from common paginated response shapes.
 *
 * Example: `{ data?: Product[] }` becomes `Product`.
 */
export type ExtractDataIfPaginated<T> = T extends {
  data?: readonly (infer Item)[] | null;
}
  ? Item
  : T;

/**
 * Keys that can be used as sort fields for an API response type.
 *
 * For paginated responses this uses the keys of the item inside `data`.
 */
export type SortableKeys<T> = keyof UnwrapArray<ExtractDataIfPaginated<T>>;

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
export type WithoutRequestParams<T extends readonly unknown[]> =
  T extends readonly [...infer Arguments, RequestParams?] ? Arguments : T;
