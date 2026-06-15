import {
  buildQuery,
  extractArgsCallbacksAndParams,
  handleApiResponse,
} from "typedapi-client-helpers";

import {
  handleGoodResult as typedApiDefaultSuccessHandler,
  handleErrors as typedApiDefaultErrorHandler,
} from "../../utils/defaultApiFunctions";

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
  Order,
} from "../generated/Order";

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
  onSuccess?: ApiSuccessHandler<
    ExtractResponse<ReturnType<Order["getOrders"]>>
  >,
  onError?: ApiErrorHandler<
    ExtractError<ReturnType<Order["getOrders"]>>
  >,
  params?: RequestParams
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
  ...argsWithCallbacks: [
    ...ApiMethodArguments<
      Order["createOrder"]
    >,
    ApiSuccessHandler<
      ExtractResponse<
        ReturnType<
          Order["createOrder"]
        >
      >
    >?,
    ApiErrorHandler<
      ExtractError<
        ReturnType<
          Order["createOrder"]
        >
      >
    >?,
    RequestParams?
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
  const {
    args,
    onSuccess,
    onError,
    params
  } = extractArgsCallbacksAndParams<
    ApiMethodArguments<
      Order["createOrder"]
    >,
    ExtractResponse<
      ReturnType<
        Order["createOrder"]
      >
    >,
    ExtractError<
      ReturnType<
        Order["createOrder"]
      >
    >
  >(argsWithCallbacks);

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
  ...argsWithCallbacks: [
    ...ApiMethodArguments<
      Order["getOrderById"]
    >,
    ApiSuccessHandler<
      ExtractResponse<
        ReturnType<
          Order["getOrderById"]
        >
      >
    >?,
    ApiErrorHandler<
      ExtractError<
        ReturnType<
          Order["getOrderById"]
        >
      >
    >?,
    RequestParams?
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
  const {
    args,
    onSuccess,
    onError,
    params
  } = extractArgsCallbacksAndParams<
    ApiMethodArguments<
      Order["getOrderById"]
    >,
    ExtractResponse<
      ReturnType<
        Order["getOrderById"]
      >
    >,
    ExtractError<
      ReturnType<
        Order["getOrderById"]
      >
    >
  >(argsWithCallbacks);

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
  ...argsWithCallbacks: [
    ...ApiMethodArguments<
      Order["updateOrder"]
    >,
    ApiSuccessHandler<
      ExtractResponse<
        ReturnType<
          Order["updateOrder"]
        >
      >
    >?,
    ApiErrorHandler<
      ExtractError<
        ReturnType<
          Order["updateOrder"]
        >
      >
    >?,
    RequestParams?
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
  const {
    args,
    onSuccess,
    onError,
    params
  } = extractArgsCallbacksAndParams<
    ApiMethodArguments<
      Order["updateOrder"]
    >,
    ExtractResponse<
      ReturnType<
        Order["updateOrder"]
      >
    >,
    ExtractError<
      ReturnType<
        Order["updateOrder"]
      >
    >
  >(argsWithCallbacks);

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
  ...argsWithCallbacks: [
    ...ApiMethodArguments<
      Order["deleteOrder"]
    >,
    ApiSuccessHandler<
      ExtractResponse<
        ReturnType<
          Order["deleteOrder"]
        >
      >
    >?,
    ApiErrorHandler<
      ExtractError<
        ReturnType<
          Order["deleteOrder"]
        >
      >
    >?,
    RequestParams?
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
  const {
    args,
    onSuccess,
    onError,
    params
  } = extractArgsCallbacksAndParams<
    ApiMethodArguments<
      Order["deleteOrder"]
    >,
    ExtractResponse<
      ReturnType<
        Order["deleteOrder"]
      >
    >,
    ExtractError<
      ReturnType<
        Order["deleteOrder"]
      >
    >
  >(argsWithCallbacks);

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
  ...argsWithCallbacks: [
    ...ApiMethodArguments<
      Order["approveOrder"]
    >,
    ApiSuccessHandler<
      ExtractResponse<
        ReturnType<
          Order["approveOrder"]
        >
      >
    >?,
    ApiErrorHandler<
      ExtractError<
        ReturnType<
          Order["approveOrder"]
        >
      >
    >?,
    RequestParams?
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
  const {
    args,
    onSuccess,
    onError,
    params
  } = extractArgsCallbacksAndParams<
    ApiMethodArguments<
      Order["approveOrder"]
    >,
    ExtractResponse<
      ReturnType<
        Order["approveOrder"]
      >
    >,
    ExtractError<
      ReturnType<
        Order["approveOrder"]
      >
    >
  >(argsWithCallbacks);

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
  ...argsWithCallbacks: [
    ...ApiMethodArguments<
      Order["cancelOrder"]
    >,
    ApiSuccessHandler<
      ExtractResponse<
        ReturnType<
          Order["cancelOrder"]
        >
      >
    >?,
    ApiErrorHandler<
      ExtractError<
        ReturnType<
          Order["cancelOrder"]
        >
      >
    >?,
    RequestParams?
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
  const {
    args,
    onSuccess,
    onError,
    params
  } = extractArgsCallbacksAndParams<
    ApiMethodArguments<
      Order["cancelOrder"]
    >,
    ExtractResponse<
      ReturnType<
        Order["cancelOrder"]
      >
    >,
    ExtractError<
      ReturnType<
        Order["cancelOrder"]
      >
    >
  >(argsWithCallbacks);

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