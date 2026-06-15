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
  Warehouse,
} from "../generated/Warehouse";

import type {
  RequestParams,
} from "../generated/http-client";

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
  options: ApiMethodOptions<
    ReturnType<Warehouse["getWarehouses"]>,
    RequestParams
  > = {}
): Promise<ApiResult<ExtractResponse<ReturnType<Warehouse["getWarehouses"]>>>> {
  const { onSuccess, onError, params } = options;

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
  ...argsWithOptions: [
    ...ApiMethodArguments<
      Warehouse["createWarehouse"],
      RequestParams
    >,
    ApiMethodOptions<
      ReturnType<Warehouse["createWarehouse"]>,
      RequestParams
    >?
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
  const args = [...argsWithOptions] as unknown[];

  const options =
    args.length > 1
      ? (args.pop() as ApiMethodOptions<
          ReturnType<Warehouse["createWarehouse"]>,
          RequestParams
        >)
      : {};

  const { onSuccess, onError, params } = options ?? {};

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
  ...argsWithOptions: [
    ...ApiMethodArguments<
      Warehouse["getWarehouseById"],
      RequestParams
    >,
    ApiMethodOptions<
      ReturnType<Warehouse["getWarehouseById"]>,
      RequestParams
    >?
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
  const args = [...argsWithOptions] as unknown[];

  const options =
    args.length > 1
      ? (args.pop() as ApiMethodOptions<
          ReturnType<Warehouse["getWarehouseById"]>,
          RequestParams
        >)
      : {};

  const { onSuccess, onError, params } = options ?? {};

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
  ...argsWithOptions: [
    ...ApiMethodArguments<
      Warehouse["updateWarehouse"],
      RequestParams
    >,
    ApiMethodOptions<
      ReturnType<Warehouse["updateWarehouse"]>,
      RequestParams
    >?
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
  const args = [...argsWithOptions] as unknown[];

  const options =
    args.length > 2
      ? (args.pop() as ApiMethodOptions<
          ReturnType<Warehouse["updateWarehouse"]>,
          RequestParams
        >)
      : {};

  const { onSuccess, onError, params } = options ?? {};

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
  ...argsWithOptions: [
    ...ApiMethodArguments<
      Warehouse["deleteWarehouse"],
      RequestParams
    >,
    ApiMethodOptions<
      ReturnType<Warehouse["deleteWarehouse"]>,
      RequestParams
    >?
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
  const args = [...argsWithOptions] as unknown[];

  const options =
    args.length > 1
      ? (args.pop() as ApiMethodOptions<
          ReturnType<Warehouse["deleteWarehouse"]>,
          RequestParams
        >)
      : {};

  const { onSuccess, onError, params } = options ?? {};

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