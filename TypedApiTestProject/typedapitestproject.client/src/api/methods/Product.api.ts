import {
  ApiResult,
  buildQuery,
  extractArgsToastsAndParams,
  FilterFormValues,
  handleApiResponse,
  SortDirection,
  ToastOptions,
} from "typedapi-client-helpers";

import { Product } from "../generated/Product";
import { RequestParams } from "../generated/http-client";

import {
  ExtractDataIfPaginated,
  ExtractResponse,
  SortableKeys,
  UnwrapArray,
  WithoutRequestParams,
} from "./Types";

/* =======================
   Query Types
   ======================= */
export type GetProductsQuery = NonNullable<
  Parameters<Product["getProducts"]>[0]
>;

export type ExportProductsQuery = NonNullable<
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
  toastOptions?: ToastOptions,
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
      ),
    toastOptions,
  );
}

/* =======================
   Simple Query Methods
   ======================= */
export async function exportProducts(
  query?: ExportProductsQuery,
  toastOptions?: ToastOptions,
): Promise<ApiResult<ExtractResponse<ReturnType<Product["exportProducts"]>>>> {
  return handleApiResponse(
    () => productApi.exportProducts(query),
    toastOptions,
  );
}

/* =======================
   Non-Query Methods
   ======================= */
export async function createProduct(
  ...argsWithToast: [
    ...WithoutRequestParams<Parameters<Product["createProduct"]>>,
    ToastOptions?,
    RequestParams?,
  ]
): Promise<ApiResult<ExtractResponse<ReturnType<Product["createProduct"]>>>> {
  const { args, toastOptions, params } =
    extractArgsToastsAndParams<
      WithoutRequestParams<Parameters<Product["createProduct"]>>
    >(argsWithToast);

  const requestArgs = [...args, params ?? {}] as unknown as Parameters<
    Product["createProduct"]
  >;

  return handleApiResponse(
    () => productApi.createProduct(...requestArgs),
    toastOptions,
  );
}

export async function getProductById(
  ...argsWithToast: [
    ...WithoutRequestParams<Parameters<Product["getProductById"]>>,
    ToastOptions?,
    RequestParams?,
  ]
): Promise<ApiResult<ExtractResponse<ReturnType<Product["getProductById"]>>>> {
  const { args, toastOptions, params } =
    extractArgsToastsAndParams<
      WithoutRequestParams<Parameters<Product["getProductById"]>>
    >(argsWithToast);

  const requestArgs = [...args, params ?? {}] as unknown as Parameters<
    Product["getProductById"]
  >;

  return handleApiResponse(
    () => productApi.getProductById(...requestArgs),
    toastOptions,
  );
}

export async function updateProduct(
  ...argsWithToast: [
    ...WithoutRequestParams<Parameters<Product["updateProduct"]>>,
    ToastOptions?,
    RequestParams?,
  ]
): Promise<ApiResult<ExtractResponse<ReturnType<Product["updateProduct"]>>>> {
  const { args, toastOptions, params } =
    extractArgsToastsAndParams<
      WithoutRequestParams<Parameters<Product["updateProduct"]>>
    >(argsWithToast);

  const requestArgs = [...args, params ?? {}] as unknown as Parameters<
    Product["updateProduct"]
  >;

  return handleApiResponse(
    () => productApi.updateProduct(...requestArgs),
    toastOptions,
  );
}

export async function deleteProduct(
  ...argsWithToast: [
    ...WithoutRequestParams<Parameters<Product["deleteProduct"]>>,
    ToastOptions?,
    RequestParams?,
  ]
): Promise<ApiResult<ExtractResponse<ReturnType<Product["deleteProduct"]>>>> {
  const { args, toastOptions, params } =
    extractArgsToastsAndParams<
      WithoutRequestParams<Parameters<Product["deleteProduct"]>>
    >(argsWithToast);

  const requestArgs = [...args, params ?? {}] as unknown as Parameters<
    Product["deleteProduct"]
  >;

  return handleApiResponse(
    () => productApi.deleteProduct(...requestArgs),
    toastOptions,
  );
}

export async function toggleProductActive(
  ...argsWithToast: [
    ...WithoutRequestParams<Parameters<Product["toggleProductActive"]>>,
    ToastOptions?,
    RequestParams?,
  ]
): Promise<
  ApiResult<ExtractResponse<ReturnType<Product["toggleProductActive"]>>>
> {
  const { args, toastOptions, params } =
    extractArgsToastsAndParams<
      WithoutRequestParams<Parameters<Product["toggleProductActive"]>>
    >(argsWithToast);

  const requestArgs = [...args, params ?? {}] as unknown as Parameters<
    Product["toggleProductActive"]
  >;

  return handleApiResponse(
    () => productApi.toggleProductActive(...requestArgs),
    toastOptions,
  );
}
