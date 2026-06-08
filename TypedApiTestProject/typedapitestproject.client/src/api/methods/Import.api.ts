import { toFormData, handleApiResponse } from "typedapi-client-helpers";

import type { ApiResult, ToastOptions } from "typedapi-client-helpers";

import { Import } from "../generated/Import";

import type { RequestParams } from "../generated/http-client";

import type { ExtractResponse } from "./Types";

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
  data: Parameters<Import["uploadProductFiles"]>[0],
  toastOptions?: ToastOptions,
  params?: RequestParams,
): Promise<
  ApiResult<ExtractResponse<ReturnType<Import["uploadProductFiles"]>>>
> {
  const formData = toFormData(data);

  return handleApiResponse(
    () =>
      importApi.uploadProductFiles(
        formData as unknown as Parameters<Import["uploadProductFiles"]>[0],
        params ?? {},
      ),
    toastOptions,
  );
}

export async function uploadSupplierFile(
  data: Parameters<Import["uploadSupplierFile"]>[0],
  toastOptions?: ToastOptions,
  params?: RequestParams,
): Promise<
  ApiResult<ExtractResponse<ReturnType<Import["uploadSupplierFile"]>>>
> {
  const formData = toFormData(data);

  return handleApiResponse(
    () =>
      importApi.uploadSupplierFile(
        formData as unknown as Parameters<Import["uploadSupplierFile"]>[0],
        params ?? {},
      ),
    toastOptions,
  );
}

export async function uploadMixedImport(
  data: Parameters<Import["uploadMixedImport"]>[0],
  toastOptions?: ToastOptions,
  params?: RequestParams,
): Promise<
  ApiResult<ExtractResponse<ReturnType<Import["uploadMixedImport"]>>>
> {
  const formData = toFormData(data);

  return handleApiResponse(
    () =>
      importApi.uploadMixedImport(
        formData as unknown as Parameters<Import["uploadMixedImport"]>[0],
        params ?? {},
      ),
    toastOptions,
  );
}
