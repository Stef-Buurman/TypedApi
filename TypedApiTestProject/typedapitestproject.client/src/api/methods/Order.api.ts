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

import { Order } from "../generated/Order";

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
export type GetOrdersQuery = NonNullable<Parameters<Order["getOrders"]>[0]>;

/* =======================
   API Instance
   ======================= */
const orderApi = new Order();

/* =======================
   Paginated Query Methods
   ======================= */
export async function getOrders(
  filters: FilterFormValues<GetOrdersQuery>[] = [],
  page = 1,
  pageSize = 100,
  sortBy: SortableKeys<
    ExtractResponse<ReturnType<Order["getOrders"]>>
  > | null = null,
  sortDirection?: SortDirection,
  toastOptions?: ToastOptions,
): Promise<ApiResult<ExtractResponse<ReturnType<Order["getOrders"]>>>> {
  return handleApiResponse(
    () =>
      orderApi.getOrders(
        buildQuery<
          GetOrdersQuery,
          UnwrapArray<
            ExtractDataIfPaginated<
              ExtractResponse<ReturnType<Order["getOrders"]>>
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
export async function createOrder(
  ...argsWithToast: [
    ...WithoutRequestParams<Parameters<Order["createOrder"]>>,
    ToastOptions?,
    RequestParams?,
  ]
): Promise<ApiResult<ExtractResponse<ReturnType<Order["createOrder"]>>>> {
  const { args, toastOptions, params } =
    extractArgsToastsAndParams<
      WithoutRequestParams<Parameters<Order["createOrder"]>>
    >(argsWithToast);

  const requestArgs = [...args, params ?? {}] as unknown as Parameters<
    Order["createOrder"]
  >;

  return handleApiResponse(
    () => orderApi.createOrder(...requestArgs),
    toastOptions,
  );
}

export async function getOrderById(
  ...argsWithToast: [
    ...WithoutRequestParams<Parameters<Order["getOrderById"]>>,
    ToastOptions?,
    RequestParams?,
  ]
): Promise<ApiResult<ExtractResponse<ReturnType<Order["getOrderById"]>>>> {
  const { args, toastOptions, params } =
    extractArgsToastsAndParams<
      WithoutRequestParams<Parameters<Order["getOrderById"]>>
    >(argsWithToast);

  const requestArgs = [...args, params ?? {}] as unknown as Parameters<
    Order["getOrderById"]
  >;

  return handleApiResponse(
    () => orderApi.getOrderById(...requestArgs),
    toastOptions,
  );
}

export async function updateOrder(
  ...argsWithToast: [
    ...WithoutRequestParams<Parameters<Order["updateOrder"]>>,
    ToastOptions?,
    RequestParams?,
  ]
): Promise<ApiResult<ExtractResponse<ReturnType<Order["updateOrder"]>>>> {
  const { args, toastOptions, params } =
    extractArgsToastsAndParams<
      WithoutRequestParams<Parameters<Order["updateOrder"]>>
    >(argsWithToast);

  const requestArgs = [...args, params ?? {}] as unknown as Parameters<
    Order["updateOrder"]
  >;

  return handleApiResponse(
    () => orderApi.updateOrder(...requestArgs),
    toastOptions,
  );
}

export async function deleteOrder(
  ...argsWithToast: [
    ...WithoutRequestParams<Parameters<Order["deleteOrder"]>>,
    ToastOptions?,
    RequestParams?,
  ]
): Promise<ApiResult<ExtractResponse<ReturnType<Order["deleteOrder"]>>>> {
  const { args, toastOptions, params } =
    extractArgsToastsAndParams<
      WithoutRequestParams<Parameters<Order["deleteOrder"]>>
    >(argsWithToast);

  const requestArgs = [...args, params ?? {}] as unknown as Parameters<
    Order["deleteOrder"]
  >;

  return handleApiResponse(
    () => orderApi.deleteOrder(...requestArgs),
    toastOptions,
  );
}

export async function approveOrder(
  ...argsWithToast: [
    ...WithoutRequestParams<Parameters<Order["approveOrder"]>>,
    ToastOptions?,
    RequestParams?,
  ]
): Promise<ApiResult<ExtractResponse<ReturnType<Order["approveOrder"]>>>> {
  const { args, toastOptions, params } =
    extractArgsToastsAndParams<
      WithoutRequestParams<Parameters<Order["approveOrder"]>>
    >(argsWithToast);

  const requestArgs = [...args, params ?? {}] as unknown as Parameters<
    Order["approveOrder"]
  >;

  return handleApiResponse(
    () => orderApi.approveOrder(...requestArgs),
    toastOptions,
  );
}

export async function cancelOrder(
  ...argsWithToast: [
    ...WithoutRequestParams<Parameters<Order["cancelOrder"]>>,
    ToastOptions?,
    RequestParams?,
  ]
): Promise<ApiResult<ExtractResponse<ReturnType<Order["cancelOrder"]>>>> {
  const { args, toastOptions, params } =
    extractArgsToastsAndParams<
      WithoutRequestParams<Parameters<Order["cancelOrder"]>>
    >(argsWithToast);

  const requestArgs = [...args, params ?? {}] as unknown as Parameters<
    Order["cancelOrder"]
  >;

  return handleApiResponse(
    () => orderApi.cancelOrder(...requestArgs),
    toastOptions,
  );
}
