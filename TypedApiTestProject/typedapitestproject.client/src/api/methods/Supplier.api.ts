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
  Supplier,
} from "../generated/Supplier";

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
export type GetSuppliersQuery =
  NonNullable<
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
  onSuccess?: ApiSuccessHandler<
    ExtractResponse<ReturnType<Supplier["getSuppliers"]>>
  >,
  onError?: ApiErrorHandler<
    ExtractError<ReturnType<Supplier["getSuppliers"]>>
  >,
  params?: RequestParams
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
export async function createSupplier(
  ...argsWithCallbacks: [
    ...ApiMethodArguments<
      Supplier["createSupplier"]
    >,
    ApiSuccessHandler<
      ExtractResponse<
        ReturnType<
          Supplier["createSupplier"]
        >
      >
    >?,
    ApiErrorHandler<
      ExtractError<
        ReturnType<
          Supplier["createSupplier"]
        >
      >
    >?,
    RequestParams?
  ]
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Supplier["createSupplier"]
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
      Supplier["createSupplier"]
    >,
    ExtractResponse<
      ReturnType<
        Supplier["createSupplier"]
      >
    >,
    ExtractError<
      ReturnType<
        Supplier["createSupplier"]
      >
    >
  >(argsWithCallbacks);

  const requestArgs = [
    ...args,
    params ?? {}
  ] as unknown as Parameters<
    Supplier["createSupplier"]
  >;

  return handleApiResponse(
    () =>
      supplierApi.createSupplier(
        ...requestArgs
      ),
    {
      onSuccess: onSuccess ?? typedApiDefaultSuccessHandler,
      onError: onError ?? typedApiDefaultErrorHandler
    }
  );
}

export async function getSupplierById(
  ...argsWithCallbacks: [
    ...ApiMethodArguments<
      Supplier["getSupplierById"]
    >,
    ApiSuccessHandler<
      ExtractResponse<
        ReturnType<
          Supplier["getSupplierById"]
        >
      >
    >?,
    ApiErrorHandler<
      ExtractError<
        ReturnType<
          Supplier["getSupplierById"]
        >
      >
    >?,
    RequestParams?
  ]
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Supplier["getSupplierById"]
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
      Supplier["getSupplierById"]
    >,
    ExtractResponse<
      ReturnType<
        Supplier["getSupplierById"]
      >
    >,
    ExtractError<
      ReturnType<
        Supplier["getSupplierById"]
      >
    >
  >(argsWithCallbacks);

  const requestArgs = [
    ...args,
    params ?? {}
  ] as unknown as Parameters<
    Supplier["getSupplierById"]
  >;

  return handleApiResponse(
    () =>
      supplierApi.getSupplierById(
        ...requestArgs
      ),
    {
      onSuccess: onSuccess ?? typedApiDefaultSuccessHandler,
      onError: onError ?? typedApiDefaultErrorHandler
    }
  );
}

export async function updateSupplier(
  ...argsWithCallbacks: [
    ...ApiMethodArguments<
      Supplier["updateSupplier"]
    >,
    ApiSuccessHandler<
      ExtractResponse<
        ReturnType<
          Supplier["updateSupplier"]
        >
      >
    >?,
    ApiErrorHandler<
      ExtractError<
        ReturnType<
          Supplier["updateSupplier"]
        >
      >
    >?,
    RequestParams?
  ]
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Supplier["updateSupplier"]
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
      Supplier["updateSupplier"]
    >,
    ExtractResponse<
      ReturnType<
        Supplier["updateSupplier"]
      >
    >,
    ExtractError<
      ReturnType<
        Supplier["updateSupplier"]
      >
    >
  >(argsWithCallbacks);

  const requestArgs = [
    ...args,
    params ?? {}
  ] as unknown as Parameters<
    Supplier["updateSupplier"]
  >;

  return handleApiResponse(
    () =>
      supplierApi.updateSupplier(
        ...requestArgs
      ),
    {
      onSuccess: onSuccess ?? typedApiDefaultSuccessHandler,
      onError: onError ?? typedApiDefaultErrorHandler
    }
  );
}

export async function deleteSupplier(
  ...argsWithCallbacks: [
    ...ApiMethodArguments<
      Supplier["deleteSupplier"]
    >,
    ApiSuccessHandler<
      ExtractResponse<
        ReturnType<
          Supplier["deleteSupplier"]
        >
      >
    >?,
    ApiErrorHandler<
      ExtractError<
        ReturnType<
          Supplier["deleteSupplier"]
        >
      >
    >?,
    RequestParams?
  ]
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Supplier["deleteSupplier"]
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
      Supplier["deleteSupplier"]
    >,
    ExtractResponse<
      ReturnType<
        Supplier["deleteSupplier"]
      >
    >,
    ExtractError<
      ReturnType<
        Supplier["deleteSupplier"]
      >
    >
  >(argsWithCallbacks);

  const requestArgs = [
    ...args,
    params ?? {}
  ] as unknown as Parameters<
    Supplier["deleteSupplier"]
  >;

  return handleApiResponse(
    () =>
      supplierApi.deleteSupplier(
        ...requestArgs
      ),
    {
      onSuccess: onSuccess ?? typedApiDefaultSuccessHandler,
      onError: onError ?? typedApiDefaultErrorHandler
    }
  );
}

export async function verifySupplier(
  ...argsWithCallbacks: [
    ...ApiMethodArguments<
      Supplier["verifySupplier"]
    >,
    ApiSuccessHandler<
      ExtractResponse<
        ReturnType<
          Supplier["verifySupplier"]
        >
      >
    >?,
    ApiErrorHandler<
      ExtractError<
        ReturnType<
          Supplier["verifySupplier"]
        >
      >
    >?,
    RequestParams?
  ]
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Supplier["verifySupplier"]
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
      Supplier["verifySupplier"]
    >,
    ExtractResponse<
      ReturnType<
        Supplier["verifySupplier"]
      >
    >,
    ExtractError<
      ReturnType<
        Supplier["verifySupplier"]
      >
    >
  >(argsWithCallbacks);

  const requestArgs = [
    ...args,
    params ?? {}
  ] as unknown as Parameters<
    Supplier["verifySupplier"]
  >;

  return handleApiResponse(
    () =>
      supplierApi.verifySupplier(
        ...requestArgs
      ),
    {
      onSuccess: onSuccess ?? typedApiDefaultSuccessHandler,
      onError: onError ?? typedApiDefaultErrorHandler
    }
  );
}