import type { HttpResponse, RequestParams } from "../generated/http-client";

export type ExtractResponse<T> =
  T extends Promise<HttpResponse<infer R, any>> ? R : never;

export type UnwrapArray<T> = T extends (infer U)[] ? U : T;

export type ExtractDataIfPaginated<T> = T extends { data?: (infer U)[] | null }
  ? U
  : T;

export type SortableKeys<T> = keyof UnwrapArray<ExtractDataIfPaginated<T>>;

export type WithoutRequestParams<T extends any[]> = T extends [
  infer First,
  ...infer Rest,
]
  ? First extends RequestParams
    ? Rest
    : [First, ...WithoutRequestParams<Rest>]
  : [];
