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
  ExtractError,
  ExtractDataIfPaginated,
  FilterFormValues,
  SortableKeys,
  SortDirection,
  UnwrapArray,
} from "typedapi-client-helpers";

import {
  Order,
} from "../generated/Order";

import type {
  RequestParams,
} from "../generated/http-client";

/* =======================
   Query Types
   ======================= */
export type GetOrdersQuery =
  NonNullable<
    Parameters<Order["getOrders"]>[0]
  >;

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
  options: ApiMethodOptions<
    ExtractResponse<ReturnType<Order["getOrders"]>>,
    ExtractError<ReturnType<Order["getOrders"]>>,
    RequestParams
  > = {}
): Promise<ApiResult<ExtractResponse<ReturnType<Order["getOrders"]>>>> {
  const { onSuccess, onError, params } = options;

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


/* =======================
   Non-Query Methods
   ======================= */
export async function createOrder(
  ...argsWithOptions: [
    ...ApiMethodArguments<
      Order["createOrder"],
      RequestParams
    >,
    ApiMethodOptions<
      ExtractResponse<ReturnType<Order["createOrder"]>>,
      ExtractError<ReturnType<Order["createOrder"]>>,
      RequestParams
    >?
  ]
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Order["createOrder"]
      >
    >
  >
> {
  const args = [...argsWithOptions] as unknown[];

  const options =
    args.length > 1
      ? (args.pop() as ApiMethodOptions<
            ExtractResponse<ReturnType<Order["createOrder"]>>,
            ExtractError<ReturnType<Order["createOrder"]>>,
            RequestParams
          >)
      : {};

  const { onSuccess, onError, params } = options ?? {};

  const requestArgs = [
    ...args,
    params ?? {}
  ] as unknown as Parameters<
    Order["createOrder"]
  >;

  return handleApiResponse(
    () =>
      orderApi.createOrder(
        ...requestArgs
      ),
    {
      onSuccess: onSuccess ?? typedApiDefaultSuccessHandler,
      onError: onError ?? typedApiDefaultErrorHandler
    }
  );
}

export async function getOrderById(
  ...argsWithOptions: [
    ...ApiMethodArguments<
      Order["getOrderById"],
      RequestParams
    >,
    ApiMethodOptions<
      ExtractResponse<ReturnType<Order["getOrderById"]>>,
      ExtractError<ReturnType<Order["getOrderById"]>>,
      RequestParams
    >?
  ]
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Order["getOrderById"]
      >
    >
  >
> {
  const args = [...argsWithOptions] as unknown[];

  const options =
    args.length > 1
      ? (args.pop() as ApiMethodOptions<
            ExtractResponse<ReturnType<Order["getOrderById"]>>,
            ExtractError<ReturnType<Order["getOrderById"]>>,
            RequestParams
          >)
      : {};

  const { onSuccess, onError, params } = options ?? {};

  const requestArgs = [
    ...args,
    params ?? {}
  ] as unknown as Parameters<
    Order["getOrderById"]
  >;

  return handleApiResponse(
    () =>
      orderApi.getOrderById(
        ...requestArgs
      ),
    {
      onSuccess: onSuccess ?? typedApiDefaultSuccessHandler,
      onError: onError ?? typedApiDefaultErrorHandler
    }
  );
}

export async function updateOrder(
  ...argsWithOptions: [
    ...ApiMethodArguments<
      Order["updateOrder"],
      RequestParams
    >,
    ApiMethodOptions<
      ExtractResponse<ReturnType<Order["updateOrder"]>>,
      ExtractError<ReturnType<Order["updateOrder"]>>,
      RequestParams
    >?
  ]
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Order["updateOrder"]
      >
    >
  >
> {
  const args = [...argsWithOptions] as unknown[];

  const options =
    args.length > 2
      ? (args.pop() as ApiMethodOptions<
            ExtractResponse<ReturnType<Order["updateOrder"]>>,
            ExtractError<ReturnType<Order["updateOrder"]>>,
            RequestParams
          >)
      : {};

  const { onSuccess, onError, params } = options ?? {};

  const requestArgs = [
    ...args,
    params ?? {}
  ] as unknown as Parameters<
    Order["updateOrder"]
  >;

  return handleApiResponse(
    () =>
      orderApi.updateOrder(
        ...requestArgs
      ),
    {
      onSuccess: onSuccess ?? typedApiDefaultSuccessHandler,
      onError: onError ?? typedApiDefaultErrorHandler
    }
  );
}

export async function deleteOrder(
  ...argsWithOptions: [
    ...ApiMethodArguments<
      Order["deleteOrder"],
      RequestParams
    >,
    ApiMethodOptions<
      ExtractResponse<ReturnType<Order["deleteOrder"]>>,
      ExtractError<ReturnType<Order["deleteOrder"]>>,
      RequestParams
    >?
  ]
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Order["deleteOrder"]
      >
    >
  >
> {
  const args = [...argsWithOptions] as unknown[];

  const options =
    args.length > 1
      ? (args.pop() as ApiMethodOptions<
            ExtractResponse<ReturnType<Order["deleteOrder"]>>,
            ExtractError<ReturnType<Order["deleteOrder"]>>,
            RequestParams
          >)
      : {};

  const { onSuccess, onError, params } = options ?? {};

  const requestArgs = [
    ...args,
    params ?? {}
  ] as unknown as Parameters<
    Order["deleteOrder"]
  >;

  return handleApiResponse(
    () =>
      orderApi.deleteOrder(
        ...requestArgs
      ),
    {
      onSuccess: onSuccess ?? typedApiDefaultSuccessHandler,
      onError: onError ?? typedApiDefaultErrorHandler
    }
  );
}

export async function approveOrder(
  ...argsWithOptions: [
    ...ApiMethodArguments<
      Order["approveOrder"],
      RequestParams
    >,
    ApiMethodOptions<
      ExtractResponse<ReturnType<Order["approveOrder"]>>,
      ExtractError<ReturnType<Order["approveOrder"]>>,
      RequestParams
    >?
  ]
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Order["approveOrder"]
      >
    >
  >
> {
  const args = [...argsWithOptions] as unknown[];

  const options =
    args.length > 1
      ? (args.pop() as ApiMethodOptions<
            ExtractResponse<ReturnType<Order["approveOrder"]>>,
            ExtractError<ReturnType<Order["approveOrder"]>>,
            RequestParams
          >)
      : {};

  const { onSuccess, onError, params } = options ?? {};

  const requestArgs = [
    ...args,
    params ?? {}
  ] as unknown as Parameters<
    Order["approveOrder"]
  >;

  return handleApiResponse(
    () =>
      orderApi.approveOrder(
        ...requestArgs
      ),
    {
      onSuccess: onSuccess ?? typedApiDefaultSuccessHandler,
      onError: onError ?? typedApiDefaultErrorHandler
    }
  );
}

export async function cancelOrder(
  ...argsWithOptions: [
    ...ApiMethodArguments<
      Order["cancelOrder"],
      RequestParams
    >,
    ApiMethodOptions<
      ExtractResponse<ReturnType<Order["cancelOrder"]>>,
      ExtractError<ReturnType<Order["cancelOrder"]>>,
      RequestParams
    >?
  ]
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Order["cancelOrder"]
      >
    >
  >
> {
  const args = [...argsWithOptions] as unknown[];

  const options =
    args.length > 1
      ? (args.pop() as ApiMethodOptions<
            ExtractResponse<ReturnType<Order["cancelOrder"]>>,
            ExtractError<ReturnType<Order["cancelOrder"]>>,
            RequestParams
          >)
      : {};

  const { onSuccess, onError, params } = options ?? {};

  const requestArgs = [
    ...args,
    params ?? {}
  ] as unknown as Parameters<
    Order["cancelOrder"]
  >;

  return handleApiResponse(
    () =>
      orderApi.cancelOrder(
        ...requestArgs
      ),
    {
      onSuccess: onSuccess ?? typedApiDefaultSuccessHandler,
      onError: onError ?? typedApiDefaultErrorHandler
    }
  );
}