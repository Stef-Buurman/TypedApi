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

import { Warehouse } from "../generated/Warehouse";

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
export type GetWarehousesQuery = NonNullable<
  Parameters<Warehouse["getWarehouses"]>[0]
>;

/* =======================
   API Instance
   ======================= */
const warehouseApi = new Warehouse();

/* =======================
   Paginated Query Methods
   ======================= */
export async function getWarehouses(
  filters: FilterFormValues<GetWarehousesQuery>[] = [],
  page = 1,
  pageSize = 100,
  sortBy: SortableKeys<
    ExtractResponse<ReturnType<Warehouse["getWarehouses"]>>
  > | null = null,
  sortDirection?: SortDirection,
  toastOptions?: ToastOptions,
): Promise<ApiResult<ExtractResponse<ReturnType<Warehouse["getWarehouses"]>>>> {
  return handleApiResponse(
    () =>
      warehouseApi.getWarehouses(
        buildQuery<
          GetWarehousesQuery,
          UnwrapArray<
            ExtractDataIfPaginated<
              ExtractResponse<ReturnType<Warehouse["getWarehouses"]>>
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
export async function createWarehouse(
  ...argsWithToast: [
    ...WithoutRequestParams<Parameters<Warehouse["createWarehouse"]>>,
    ToastOptions?,
    RequestParams?,
  ]
): Promise<
  ApiResult<ExtractResponse<ReturnType<Warehouse["createWarehouse"]>>>
> {
  const { args, toastOptions, params } =
    extractArgsToastsAndParams<
      WithoutRequestParams<Parameters<Warehouse["createWarehouse"]>>
    >(argsWithToast);

  const requestArgs = [...args, params ?? {}] as unknown as Parameters<
    Warehouse["createWarehouse"]
  >;

  return handleApiResponse(
    () => warehouseApi.createWarehouse(...requestArgs),
    toastOptions,
  );
}

export async function getWarehouseById(
  ...argsWithToast: [
    ...WithoutRequestParams<Parameters<Warehouse["getWarehouseById"]>>,
    ToastOptions?,
    RequestParams?,
  ]
): Promise<
  ApiResult<ExtractResponse<ReturnType<Warehouse["getWarehouseById"]>>>
> {
  const { args, toastOptions, params } =
    extractArgsToastsAndParams<
      WithoutRequestParams<Parameters<Warehouse["getWarehouseById"]>>
    >(argsWithToast);

  const requestArgs = [...args, params ?? {}] as unknown as Parameters<
    Warehouse["getWarehouseById"]
  >;

  return handleApiResponse(
    () => warehouseApi.getWarehouseById(...requestArgs),
    toastOptions,
  );
}

export async function updateWarehouse(
  ...argsWithToast: [
    ...WithoutRequestParams<Parameters<Warehouse["updateWarehouse"]>>,
    ToastOptions?,
    RequestParams?,
  ]
): Promise<
  ApiResult<ExtractResponse<ReturnType<Warehouse["updateWarehouse"]>>>
> {
  const { args, toastOptions, params } =
    extractArgsToastsAndParams<
      WithoutRequestParams<Parameters<Warehouse["updateWarehouse"]>>
    >(argsWithToast);

  const requestArgs = [...args, params ?? {}] as unknown as Parameters<
    Warehouse["updateWarehouse"]
  >;

  return handleApiResponse(
    () => warehouseApi.updateWarehouse(...requestArgs),
    toastOptions,
  );
}

export async function deleteWarehouse(
  ...argsWithToast: [
    ...WithoutRequestParams<Parameters<Warehouse["deleteWarehouse"]>>,
    ToastOptions?,
    RequestParams?,
  ]
): Promise<
  ApiResult<ExtractResponse<ReturnType<Warehouse["deleteWarehouse"]>>>
> {
  const { args, toastOptions, params } =
    extractArgsToastsAndParams<
      WithoutRequestParams<Parameters<Warehouse["deleteWarehouse"]>>
    >(argsWithToast);

  const requestArgs = [...args, params ?? {}] as unknown as Parameters<
    Warehouse["deleteWarehouse"]
  >;

  return handleApiResponse(
    () => warehouseApi.deleteWarehouse(...requestArgs),
    toastOptions,
  );
}
