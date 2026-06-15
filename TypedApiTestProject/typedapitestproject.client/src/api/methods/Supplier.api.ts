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
  Supplier,
} from "../generated/Supplier";

import type {
  RequestParams,
} from "../generated/http-client";

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
  options: ApiMethodOptions<
    ExtractResponse<ReturnType<Supplier["getSuppliers"]>>,
    ExtractError<ReturnType<Supplier["getSuppliers"]>>,
    RequestParams
  > = {}
): Promise<ApiResult<ExtractResponse<ReturnType<Supplier["getSuppliers"]>>>> {
  const { onSuccess, onError, params } = options;

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
  ...argsWithOptions: [
    ...ApiMethodArguments<
      Supplier["createSupplier"],
      RequestParams
    >,
    ApiMethodOptions<
      ExtractResponse<ReturnType<Supplier["createSupplier"]>>,
      ExtractError<ReturnType<Supplier["createSupplier"]>>,
      RequestParams
    >?
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
  const args = [...argsWithOptions] as unknown[];

  const options =
    args.length > 1
      ? (args.pop() as ApiMethodOptions<
            ExtractResponse<ReturnType<Supplier["createSupplier"]>>,
            ExtractError<ReturnType<Supplier["createSupplier"]>>,
            RequestParams
          >)
      : {};

  const { onSuccess, onError, params } = options ?? {};

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
  ...argsWithOptions: [
    ...ApiMethodArguments<
      Supplier["getSupplierById"],
      RequestParams
    >,
    ApiMethodOptions<
      ExtractResponse<ReturnType<Supplier["getSupplierById"]>>,
      ExtractError<ReturnType<Supplier["getSupplierById"]>>,
      RequestParams
    >?
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
  const args = [...argsWithOptions] as unknown[];

  const options =
    args.length > 1
      ? (args.pop() as ApiMethodOptions<
            ExtractResponse<ReturnType<Supplier["getSupplierById"]>>,
            ExtractError<ReturnType<Supplier["getSupplierById"]>>,
            RequestParams
          >)
      : {};

  const { onSuccess, onError, params } = options ?? {};

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
  ...argsWithOptions: [
    ...ApiMethodArguments<
      Supplier["updateSupplier"],
      RequestParams
    >,
    ApiMethodOptions<
      ExtractResponse<ReturnType<Supplier["updateSupplier"]>>,
      ExtractError<ReturnType<Supplier["updateSupplier"]>>,
      RequestParams
    >?
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
  const args = [...argsWithOptions] as unknown[];

  const options =
    args.length > 2
      ? (args.pop() as ApiMethodOptions<
            ExtractResponse<ReturnType<Supplier["updateSupplier"]>>,
            ExtractError<ReturnType<Supplier["updateSupplier"]>>,
            RequestParams
          >)
      : {};

  const { onSuccess, onError, params } = options ?? {};

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
  ...argsWithOptions: [
    ...ApiMethodArguments<
      Supplier["deleteSupplier"],
      RequestParams
    >,
    ApiMethodOptions<
      ExtractResponse<ReturnType<Supplier["deleteSupplier"]>>,
      ExtractError<ReturnType<Supplier["deleteSupplier"]>>,
      RequestParams
    >?
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
  const args = [...argsWithOptions] as unknown[];

  const options =
    args.length > 1
      ? (args.pop() as ApiMethodOptions<
            ExtractResponse<ReturnType<Supplier["deleteSupplier"]>>,
            ExtractError<ReturnType<Supplier["deleteSupplier"]>>,
            RequestParams
          >)
      : {};

  const { onSuccess, onError, params } = options ?? {};

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
  ...argsWithOptions: [
    ...ApiMethodArguments<
      Supplier["verifySupplier"],
      RequestParams
    >,
    ApiMethodOptions<
      ExtractResponse<ReturnType<Supplier["verifySupplier"]>>,
      ExtractError<ReturnType<Supplier["verifySupplier"]>>,
      RequestParams
    >?
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
  const args = [...argsWithOptions] as unknown[];

  const options =
    args.length > 1
      ? (args.pop() as ApiMethodOptions<
            ExtractResponse<ReturnType<Supplier["verifySupplier"]>>,
            ExtractError<ReturnType<Supplier["verifySupplier"]>>,
            RequestParams
          >)
      : {};

  const { onSuccess, onError, params } = options ?? {};

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