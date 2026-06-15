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
  Warehouse,
} from "../generated/Warehouse";

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
export type GetWarehousesQuery =
  NonNullable<
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
  onSuccess?: ApiSuccessHandler<
    ExtractResponse<ReturnType<Warehouse["getWarehouses"]>>
  >,
  onError?: ApiErrorHandler<
    ExtractError<ReturnType<Warehouse["getWarehouses"]>>
  >,
  params?: RequestParams
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
export async function createWarehouse(
  ...argsWithCallbacks: [
    ...ApiMethodArguments<
      Warehouse["createWarehouse"]
    >,
    ApiSuccessHandler<
      ExtractResponse<
        ReturnType<
          Warehouse["createWarehouse"]
        >
      >
    >?,
    ApiErrorHandler<
      ExtractError<
        ReturnType<
          Warehouse["createWarehouse"]
        >
      >
    >?,
    RequestParams?
  ]
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Warehouse["createWarehouse"]
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
      Warehouse["createWarehouse"]
    >,
    ExtractResponse<
      ReturnType<
        Warehouse["createWarehouse"]
      >
    >,
    ExtractError<
      ReturnType<
        Warehouse["createWarehouse"]
      >
    >
  >(argsWithCallbacks);

  const requestArgs = [
    ...args,
    params ?? {}
  ] as unknown as Parameters<
    Warehouse["createWarehouse"]
  >;

  return handleApiResponse(
    () =>
      warehouseApi.createWarehouse(
        ...requestArgs
      ),
    {
      onSuccess: onSuccess ?? typedApiDefaultSuccessHandler,
      onError: onError ?? typedApiDefaultErrorHandler
    }
  );
}

export async function getWarehouseById(
  ...argsWithCallbacks: [
    ...ApiMethodArguments<
      Warehouse["getWarehouseById"]
    >,
    ApiSuccessHandler<
      ExtractResponse<
        ReturnType<
          Warehouse["getWarehouseById"]
        >
      >
    >?,
    ApiErrorHandler<
      ExtractError<
        ReturnType<
          Warehouse["getWarehouseById"]
        >
      >
    >?,
    RequestParams?
  ]
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Warehouse["getWarehouseById"]
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
      Warehouse["getWarehouseById"]
    >,
    ExtractResponse<
      ReturnType<
        Warehouse["getWarehouseById"]
      >
    >,
    ExtractError<
      ReturnType<
        Warehouse["getWarehouseById"]
      >
    >
  >(argsWithCallbacks);

  const requestArgs = [
    ...args,
    params ?? {}
  ] as unknown as Parameters<
    Warehouse["getWarehouseById"]
  >;

  return handleApiResponse(
    () =>
      warehouseApi.getWarehouseById(
        ...requestArgs
      ),
    {
      onSuccess: onSuccess ?? typedApiDefaultSuccessHandler,
      onError: onError ?? typedApiDefaultErrorHandler
    }
  );
}

export async function updateWarehouse(
  ...argsWithCallbacks: [
    ...ApiMethodArguments<
      Warehouse["updateWarehouse"]
    >,
    ApiSuccessHandler<
      ExtractResponse<
        ReturnType<
          Warehouse["updateWarehouse"]
        >
      >
    >?,
    ApiErrorHandler<
      ExtractError<
        ReturnType<
          Warehouse["updateWarehouse"]
        >
      >
    >?,
    RequestParams?
  ]
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Warehouse["updateWarehouse"]
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
      Warehouse["updateWarehouse"]
    >,
    ExtractResponse<
      ReturnType<
        Warehouse["updateWarehouse"]
      >
    >,
    ExtractError<
      ReturnType<
        Warehouse["updateWarehouse"]
      >
    >
  >(argsWithCallbacks);

  const requestArgs = [
    ...args,
    params ?? {}
  ] as unknown as Parameters<
    Warehouse["updateWarehouse"]
  >;

  return handleApiResponse(
    () =>
      warehouseApi.updateWarehouse(
        ...requestArgs
      ),
    {
      onSuccess: onSuccess ?? typedApiDefaultSuccessHandler,
      onError: onError ?? typedApiDefaultErrorHandler
    }
  );
}

export async function deleteWarehouse(
  ...argsWithCallbacks: [
    ...ApiMethodArguments<
      Warehouse["deleteWarehouse"]
    >,
    ApiSuccessHandler<
      ExtractResponse<
        ReturnType<
          Warehouse["deleteWarehouse"]
        >
      >
    >?,
    ApiErrorHandler<
      ExtractError<
        ReturnType<
          Warehouse["deleteWarehouse"]
        >
      >
    >?,
    RequestParams?
  ]
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Warehouse["deleteWarehouse"]
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
      Warehouse["deleteWarehouse"]
    >,
    ExtractResponse<
      ReturnType<
        Warehouse["deleteWarehouse"]
      >
    >,
    ExtractError<
      ReturnType<
        Warehouse["deleteWarehouse"]
      >
    >
  >(argsWithCallbacks);

  const requestArgs = [
    ...args,
    params ?? {}
  ] as unknown as Parameters<
    Warehouse["deleteWarehouse"]
  >;

  return handleApiResponse(
    () =>
      warehouseApi.deleteWarehouse(
        ...requestArgs
      ),
    {
      onSuccess: onSuccess ?? typedApiDefaultSuccessHandler,
      onError: onError ?? typedApiDefaultErrorHandler
    }
  );
}