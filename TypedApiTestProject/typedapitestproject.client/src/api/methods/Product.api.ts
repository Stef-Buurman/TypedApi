import {
  buildQuery,
  extractArgsCallbacksAndParams,
  handleApiResponse,
} from "typedapi-client-helpers";

import {
  handleGoodResult as typedApiDefaultSuccessHandler,
  handleErrors as typedApiDefaultErrorHandler,
} from "../../defaultApiFunctions";

import type {
  ApiResult,
  ApiSuccessHandler,
  ApiErrorHandler,
  ExtractResponse,
  ExtractError,
  ExtractDataIfPaginated,
  FilterFormValues,
  SortableKeys,
  SortDirection,
  UnwrapArray,
} from "typedapi-client-helpers";

import {
  Product,
} from "../generated/Product";

import type {
  RequestParams,
} from "../generated/http-client";

type ApiMethodArguments<
      TMethod extends (...args: any[]) => unknown
    > =
      Parameters<TMethod> extends [
        ...infer Arguments,
        unknown?
      ]
        ? Arguments
        : Parameters<TMethod>;

/* =======================
   Query Types
   ======================= */
export type GetProductsQuery =
  NonNullable<
    Parameters<Product["getProducts"]>[0]
  >;

export type ExportProductsQuery =
  NonNullable<
    Parameters<Product["exportProducts"]>[0]
  >;

/* =======================
   API Instance
   ======================= */
const productApi = new Product();

/* =======================
   Paginated Query Methods
   ======================= */
export async function getProducts(
  filters: FilterFormValues<GetProductsQuery>[] = [],
  page = 1,
  pageSize = 100,
  sortBy: SortableKeys<
    ExtractResponse<ReturnType<Product["getProducts"]>>
  > | null = null,
  sortDirection?: SortDirection,
  onSuccess?: ApiSuccessHandler<
    ExtractResponse<ReturnType<Product["getProducts"]>>
  >,
  onError?: ApiErrorHandler<
    ExtractError<ReturnType<Product["getProducts"]>>
  >,
  params?: RequestParams
): Promise<ApiResult<ExtractResponse<ReturnType<Product["getProducts"]>>>> {
  return handleApiResponse(
    () =>
      productApi.getProducts(
        buildQuery<
          GetProductsQuery,
          UnwrapArray<
            ExtractDataIfPaginated<
              ExtractResponse<ReturnType<Product["getProducts"]>>
            >
          >
        >(filters, page, pageSize, sortBy, sortDirection),
        params ?? {}
      ),
    {
      onSuccess: onSuccess ?? typedApiDefaultSuccessHandler,
      onError: onError ?? typedApiDefaultErrorHandler
    }
  );
}

/* =======================
   Simple Query Methods
   ======================= */
export async function exportProducts(
  query?: ExportProductsQuery,
  onSuccess?: ApiSuccessHandler<
    ExtractResponse<ReturnType<Product["exportProducts"]>>
  >,
  onError?: ApiErrorHandler<
    ExtractError<ReturnType<Product["exportProducts"]>>
  >,
  params?: RequestParams
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Product["exportProducts"]
      >
    >
  >
> {
  return handleApiResponse(
    () =>
      productApi.exportProducts(query, params ?? {}),
    {
      onSuccess: onSuccess ?? typedApiDefaultSuccessHandler,
      onError: onError ?? typedApiDefaultErrorHandler
    }
  );
}

/* =======================
   Non-Query Methods
   ======================= */
export async function createProduct(
  ...argsWithCallbacks: [
    ...ApiMethodArguments<
      Product["createProduct"]
    >,
    ApiSuccessHandler<
      ExtractResponse<
        ReturnType<
          Product["createProduct"]
        >
      >
    >?,
    ApiErrorHandler<
      ExtractError<
        ReturnType<
          Product["createProduct"]
        >
      >
    >?,
    RequestParams?
  ]
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Product["createProduct"]
      >
    >
  >
> {
  const {
    args,
    onSuccess,
    onError,
    params
  } = extractArgsCallbacksAndParams<
    ApiMethodArguments<
      Product["createProduct"]
    >,
    ExtractResponse<
      ReturnType<
        Product["createProduct"]
      >
    >,
    ExtractError<
      ReturnType<
        Product["createProduct"]
      >
    >
  >(argsWithCallbacks);

  const requestArgs = [
    ...args,
    params ?? {}
  ] as unknown as Parameters<
    Product["createProduct"]
  >;

  return handleApiResponse(
    () =>
      productApi.createProduct(
        ...requestArgs
      ),
    {
      onSuccess: onSuccess ?? typedApiDefaultSuccessHandler,
      onError: onError ?? typedApiDefaultErrorHandler
    }
  );
}

export async function getProductById(
  ...argsWithCallbacks: [
    ...ApiMethodArguments<
      Product["getProductById"]
    >,
    ApiSuccessHandler<
      ExtractResponse<
        ReturnType<
          Product["getProductById"]
        >
      >
    >?,
    ApiErrorHandler<
      ExtractError<
        ReturnType<
          Product["getProductById"]
        >
      >
    >?,
    RequestParams?
  ]
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Product["getProductById"]
      >
    >
  >
> {
  const {
    args,
    onSuccess,
    onError,
    params
  } = extractArgsCallbacksAndParams<
    ApiMethodArguments<
      Product["getProductById"]
    >,
    ExtractResponse<
      ReturnType<
        Product["getProductById"]
      >
    >,
    ExtractError<
      ReturnType<
        Product["getProductById"]
      >
    >
  >(argsWithCallbacks);

  const requestArgs = [
    ...args,
    params ?? {}
  ] as unknown as Parameters<
    Product["getProductById"]
  >;

  return handleApiResponse(
    () =>
      productApi.getProductById(
        ...requestArgs
      ),
    {
      onSuccess: onSuccess ?? typedApiDefaultSuccessHandler,
      onError: onError ?? typedApiDefaultErrorHandler
    }
  );
}

export async function updateProduct(
  ...argsWithCallbacks: [
    ...ApiMethodArguments<
      Product["updateProduct"]
    >,
    ApiSuccessHandler<
      ExtractResponse<
        ReturnType<
          Product["updateProduct"]
        >
      >
    >?,
    ApiErrorHandler<
      ExtractError<
        ReturnType<
          Product["updateProduct"]
        >
      >
    >?,
    RequestParams?
  ]
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Product["updateProduct"]
      >
    >
  >
> {
  const {
    args,
    onSuccess,
    onError,
    params
  } = extractArgsCallbacksAndParams<
    ApiMethodArguments<
      Product["updateProduct"]
    >,
    ExtractResponse<
      ReturnType<
        Product["updateProduct"]
      >
    >,
    ExtractError<
      ReturnType<
        Product["updateProduct"]
      >
    >
  >(argsWithCallbacks);

  const requestArgs = [
    ...args,
    params ?? {}
  ] as unknown as Parameters<
    Product["updateProduct"]
  >;

  return handleApiResponse(
    () =>
      productApi.updateProduct(
        ...requestArgs
      ),
    {
      onSuccess: onSuccess ?? typedApiDefaultSuccessHandler,
      onError: onError ?? typedApiDefaultErrorHandler
    }
  );
}

export async function deleteProduct(
  ...argsWithCallbacks: [
    ...ApiMethodArguments<
      Product["deleteProduct"]
    >,
    ApiSuccessHandler<
      ExtractResponse<
        ReturnType<
          Product["deleteProduct"]
        >
      >
    >?,
    ApiErrorHandler<
      ExtractError<
        ReturnType<
          Product["deleteProduct"]
        >
      >
    >?,
    RequestParams?
  ]
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Product["deleteProduct"]
      >
    >
  >
> {
  const {
    args,
    onSuccess,
    onError,
    params
  } = extractArgsCallbacksAndParams<
    ApiMethodArguments<
      Product["deleteProduct"]
    >,
    ExtractResponse<
      ReturnType<
        Product["deleteProduct"]
      >
    >,
    ExtractError<
      ReturnType<
        Product["deleteProduct"]
      >
    >
  >(argsWithCallbacks);

  const requestArgs = [
    ...args,
    params ?? {}
  ] as unknown as Parameters<
    Product["deleteProduct"]
  >;

  return handleApiResponse(
    () =>
      productApi.deleteProduct(
        ...requestArgs
      ),
    {
      onSuccess: onSuccess ?? typedApiDefaultSuccessHandler,
      onError: onError ?? typedApiDefaultErrorHandler
    }
  );
}

export async function toggleProductActive(
  ...argsWithCallbacks: [
    ...ApiMethodArguments<
      Product["toggleProductActive"]
    >,
    ApiSuccessHandler<
      ExtractResponse<
        ReturnType<
          Product["toggleProductActive"]
        >
      >
    >?,
    ApiErrorHandler<
      ExtractError<
        ReturnType<
          Product["toggleProductActive"]
        >
      >
    >?,
    RequestParams?
  ]
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Product["toggleProductActive"]
      >
    >
  >
> {
  const {
    args,
    onSuccess,
    onError,
    params
  } = extractArgsCallbacksAndParams<
    ApiMethodArguments<
      Product["toggleProductActive"]
    >,
    ExtractResponse<
      ReturnType<
        Product["toggleProductActive"]
      >
    >,
    ExtractError<
      ReturnType<
        Product["toggleProductActive"]
      >
    >
  >(argsWithCallbacks);

  const requestArgs = [
    ...args,
    params ?? {}
  ] as unknown as Parameters<
    Product["toggleProductActive"]
  >;

  return handleApiResponse(
    () =>
      productApi.toggleProductActive(
        ...requestArgs
      ),
    {
      onSuccess: onSuccess ?? typedApiDefaultSuccessHandler,
      onError: onError ?? typedApiDefaultErrorHandler
    }
  );
}