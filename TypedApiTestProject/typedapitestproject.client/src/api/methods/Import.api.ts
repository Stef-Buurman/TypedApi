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
  ApiMethodOptions,
  ExtractResponse,
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
  options: ApiMethodOptions<
    ReturnType<Import["uploadProductFiles"]>,
    RequestParams
  > = {}
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Import["uploadProductFiles"]
      >
    >
  >
> {
  const { onSuccess, onError, params } = options;
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
  options: ApiMethodOptions<
    ReturnType<Import["uploadSupplierFile"]>,
    RequestParams
  > = {}
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Import["uploadSupplierFile"]
      >
    >
  >
> {
  const { onSuccess, onError, params } = options;
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
  options: ApiMethodOptions<
    ReturnType<Import["uploadMixedImport"]>,
    RequestParams
  > = {}
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        Import["uploadMixedImport"]
      >
    >
  >
> {
  const { onSuccess, onError, params } = options;
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