import {
  toFormData,
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
} from "typedapi-client-helpers";

import {
  Import,
} from "../generated/Import";

import type {
  RequestParams,
} from "../generated/http-client";



/* =======================
   Query Types
   ======================= */


/* =======================
   API Instance
   ======================= */
const importApi = new Import();

/* =======================
   Paginated Query Methods
   ======================= */


/* =======================
   Simple Query Methods
   ======================= */


/* =======================
   Non-Query Methods
   ======================= */
export async function uploadProductFiles(
  data: Parameters<
    Import["uploadProductFiles"]
  >[0],
  onSuccess?: ApiSuccessHandler<
    ExtractResponse<ReturnType<Import["uploadProductFiles"]>>
  >,
  onError?: ApiErrorHandler<
    ExtractError<ReturnType<Import["uploadProductFiles"]>>
  >,
  params?: RequestParams
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Import["uploadProductFiles"]
      >
    >
  >
> {
  const formData = toFormData(data);

  return handleApiResponse(
    () =>
      importApi.uploadProductFiles(
        formData as unknown as Parameters<
          Import["uploadProductFiles"]
        >[0],
        params ?? {}
      ),
    {
      onSuccess: onSuccess ?? typedApiDefaultSuccessHandler,
      onError: onError ?? typedApiDefaultErrorHandler
    }
  );
}

export async function uploadSupplierFile(
  data: Parameters<
    Import["uploadSupplierFile"]
  >[0],
  onSuccess?: ApiSuccessHandler<
    ExtractResponse<ReturnType<Import["uploadSupplierFile"]>>
  >,
  onError?: ApiErrorHandler<
    ExtractError<ReturnType<Import["uploadSupplierFile"]>>
  >,
  params?: RequestParams
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Import["uploadSupplierFile"]
      >
    >
  >
> {
  const formData = toFormData(data);

  return handleApiResponse(
    () =>
      importApi.uploadSupplierFile(
        formData as unknown as Parameters<
          Import["uploadSupplierFile"]
        >[0],
        params ?? {}
      ),
    {
      onSuccess: onSuccess ?? typedApiDefaultSuccessHandler,
      onError: onError ?? typedApiDefaultErrorHandler
    }
  );
}

export async function uploadMixedImport(
  data: Parameters<
    Import["uploadMixedImport"]
  >[0],
  onSuccess?: ApiSuccessHandler<
    ExtractResponse<ReturnType<Import["uploadMixedImport"]>>
  >,
  onError?: ApiErrorHandler<
    ExtractError<ReturnType<Import["uploadMixedImport"]>>
  >,
  params?: RequestParams
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Import["uploadMixedImport"]
      >
    >
  >
> {
  const formData = toFormData(data);

  return handleApiResponse(
    () =>
      importApi.uploadMixedImport(
        formData as unknown as Parameters<
          Import["uploadMixedImport"]
        >[0],
        params ?? {}
      ),
    {
      onSuccess: onSuccess ?? typedApiDefaultSuccessHandler,
      onError: onError ?? typedApiDefaultErrorHandler
    }
  );
}