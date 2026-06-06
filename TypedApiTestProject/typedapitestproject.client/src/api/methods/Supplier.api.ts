import {
  buildQuery,
  extractArgsToastsAndParams,
  handleApiResponse,
} from "typedapi-client-helpers";

import type {
  ApiResult,
  FilterFormValues,
  SortDirection,
  ToastOptions,
} from "typedapi-client-helpers";

import { Supplier } from "../generated/Supplier";

import type { RequestParams } from "../generated/http-client";

import type {
  ExtractDataIfPaginated,
  SortableKeys,
  UnwrapArray,
  ExtractResponse,
  WithoutRequestParams,
} from "./Types";

/* =======================
   Query Types
   ======================= */
export type GetSuppliersQuery = NonNullable<
  Parameters<Supplier["getSuppliers"]>[0]
>;

/* =======================
   API Instance
   ======================= */
const supplierApi = new Supplier();

/* =======================
   Paginated Query Methods
   ======================= */
export async function getSuppliers(
  filters: FilterFormValues<GetSuppliersQuery>[] = [],
  page = 1,
  pageSize = 100,
  sortBy: SortableKeys<
    ExtractResponse<ReturnType<Supplier["getSuppliers"]>>
  > | null = null,
  sortDirection?: SortDirection,
  toastOptions?: ToastOptions,
): Promise<ApiResult<ExtractResponse<ReturnType<Supplier["getSuppliers"]>>>> {
  return handleApiResponse(
    () =>
      supplierApi.getSuppliers(
        buildQuery<
          GetSuppliersQuery,
          UnwrapArray<
            ExtractDataIfPaginated<
              ExtractResponse<ReturnType<Supplier["getSuppliers"]>>
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

/* =======================
   Non-Query Methods
   ======================= */
export async function createSupplier(
  ...argsWithToast: [
    ...WithoutRequestParams<Parameters<Supplier["createSupplier"]>>,
    ToastOptions?,
    RequestParams?,
  ]
): Promise<ApiResult<ExtractResponse<ReturnType<Supplier["createSupplier"]>>>> {
  const { args, toastOptions, params } =
    extractArgsToastsAndParams<
      WithoutRequestParams<Parameters<Supplier["createSupplier"]>>
    >(argsWithToast);

  const requestArgs = [...args, params ?? {}] as unknown as Parameters<
    Supplier["createSupplier"]
  >;

  return handleApiResponse(
    () => supplierApi.createSupplier(...requestArgs),
    toastOptions,
  );
}

export async function getSupplierById(
  ...argsWithToast: [
    ...WithoutRequestParams<Parameters<Supplier["getSupplierById"]>>,
    ToastOptions?,
    RequestParams?,
  ]
): Promise<
  ApiResult<ExtractResponse<ReturnType<Supplier["getSupplierById"]>>>
> {
  const { args, toastOptions, params } =
    extractArgsToastsAndParams<
      WithoutRequestParams<Parameters<Supplier["getSupplierById"]>>
    >(argsWithToast);

  const requestArgs = [...args, params ?? {}] as unknown as Parameters<
    Supplier["getSupplierById"]
  >;

  return handleApiResponse(
    () => supplierApi.getSupplierById(...requestArgs),
    toastOptions,
  );
}

export async function updateSupplier(
  ...argsWithToast: [
    ...WithoutRequestParams<Parameters<Supplier["updateSupplier"]>>,
    ToastOptions?,
    RequestParams?,
  ]
): Promise<ApiResult<ExtractResponse<ReturnType<Supplier["updateSupplier"]>>>> {
  const { args, toastOptions, params } =
    extractArgsToastsAndParams<
      WithoutRequestParams<Parameters<Supplier["updateSupplier"]>>
    >(argsWithToast);

  const requestArgs = [...args, params ?? {}] as unknown as Parameters<
    Supplier["updateSupplier"]
  >;

  return handleApiResponse(
    () => supplierApi.updateSupplier(...requestArgs),
    toastOptions,
  );
}

export async function deleteSupplier(
  ...argsWithToast: [
    ...WithoutRequestParams<Parameters<Supplier["deleteSupplier"]>>,
    ToastOptions?,
    RequestParams?,
  ]
): Promise<ApiResult<ExtractResponse<ReturnType<Supplier["deleteSupplier"]>>>> {
  const { args, toastOptions, params } =
    extractArgsToastsAndParams<
      WithoutRequestParams<Parameters<Supplier["deleteSupplier"]>>
    >(argsWithToast);

  const requestArgs = [...args, params ?? {}] as unknown as Parameters<
    Supplier["deleteSupplier"]
  >;

  return handleApiResponse(
    () => supplierApi.deleteSupplier(...requestArgs),
    toastOptions,
  );
}

export async function verifySupplier(
  ...argsWithToast: [
    ...WithoutRequestParams<Parameters<Supplier["verifySupplier"]>>,
    ToastOptions?,
    RequestParams?,
  ]
): Promise<ApiResult<ExtractResponse<ReturnType<Supplier["verifySupplier"]>>>> {
  const { args, toastOptions, params } =
    extractArgsToastsAndParams<
      WithoutRequestParams<Parameters<Supplier["verifySupplier"]>>
    >(argsWithToast);

  const requestArgs = [...args, params ?? {}] as unknown as Parameters<
    Supplier["verifySupplier"]
  >;

  return handleApiResponse(
    () => supplierApi.verifySupplier(...requestArgs),
    toastOptions,
  );
}
