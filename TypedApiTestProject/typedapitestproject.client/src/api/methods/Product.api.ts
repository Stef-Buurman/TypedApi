import {
  buildQuery,
  handleApiResponse,
} from "typedapi-client-helpers";

import {
  handleGoodResult as typedApiDefaultSuccessHandler,
  handleErrors as typedApiDefaultErrorHandler,
} from "../../utils/defaultApiFunctions";

import type {
  ApiResult,
  ApiMethodOptions,
  ApiMethodArguments,
  ExtractResponse,
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
  options: ApiMethodOptions<
    ReturnType<Product["getProducts"]>,
    RequestParams
  > = {}
): Promise<ApiResult<ExtractResponse<ReturnType<Product["getProducts"]>>>> {
  const { onSuccess, onError, params } = options;

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
  options: ApiMethodOptions<
    ReturnType<Product["exportProducts"]>,
    RequestParams
  > = {}
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Product["exportProducts"]
      >
    >
  >
> {
  const { onSuccess, onError, params } = options;

  return handleApiResponse(
    () =>
      productApi.exportProducts(
        (query ?? {}) as ExportProductsQuery,
        params ?? {}
      ),
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
  ...argsWithOptions: [
    ...ApiMethodArguments<
      Product["createProduct"],
      RequestParams
    >,
    ApiMethodOptions<
      ReturnType<Product["createProduct"]>,
      RequestParams
    >?
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
  const args = [...argsWithOptions] as unknown[];

  const options =
    args.length > 1
      ? (args.pop() as ApiMethodOptions<
          ReturnType<Product["createProduct"]>,
          RequestParams
        >)
      : {};

  const { onSuccess, onError, params } = options ?? {};

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
  ...argsWithOptions: [
    ...ApiMethodArguments<
      Product["getProductById"],
      RequestParams
    >,
    ApiMethodOptions<
      ReturnType<Product["getProductById"]>,
      RequestParams
    >?
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
  const args = [...argsWithOptions] as unknown[];

  const options =
    args.length > 1
      ? (args.pop() as ApiMethodOptions<
          ReturnType<Product["getProductById"]>,
          RequestParams
        >)
      : {};

  const { onSuccess, onError, params } = options ?? {};

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
  ...argsWithOptions: [
    ...ApiMethodArguments<
      Product["updateProduct"],
      RequestParams
    >,
    ApiMethodOptions<
      ReturnType<Product["updateProduct"]>,
      RequestParams
    >?
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
  const args = [...argsWithOptions] as unknown[];

  const options =
    args.length > 2
      ? (args.pop() as ApiMethodOptions<
          ReturnType<Product["updateProduct"]>,
          RequestParams
        >)
      : {};

  const { onSuccess, onError, params } = options ?? {};

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
  ...argsWithOptions: [
    ...ApiMethodArguments<
      Product["deleteProduct"],
      RequestParams
    >,
    ApiMethodOptions<
      ReturnType<Product["deleteProduct"]>,
      RequestParams
    >?
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
  const args = [...argsWithOptions] as unknown[];

  const options =
    args.length > 1
      ? (args.pop() as ApiMethodOptions<
          ReturnType<Product["deleteProduct"]>,
          RequestParams
        >)
      : {};

  const { onSuccess, onError, params } = options ?? {};

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
  ...argsWithOptions: [
    ...ApiMethodArguments<
      Product["toggleProductActive"],
      RequestParams
    >,
    ApiMethodOptions<
      ReturnType<Product["toggleProductActive"]>,
      RequestParams
    >?
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
  const args = [...argsWithOptions] as unknown[];

  const options =
    args.length > 1
      ? (args.pop() as ApiMethodOptions<
          ReturnType<Product["toggleProductActive"]>,
          RequestParams
        >)
      : {};

  const { onSuccess, onError, params } = options ?? {};

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