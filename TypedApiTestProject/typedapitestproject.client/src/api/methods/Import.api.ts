import {
  ApiResult,
  buildQuery,
  extractArgsToastsAndParams,
  FilterFormValues,
  handleApiResponse,
  SortDirection,
  ToastOptions,
} from "typedapi-client-helpers";

import { Import } from "../generated/Import";
import { RequestParams } from "../generated/http-client";

import {
  ExtractDataIfPaginated,
  ExtractResponse,
  SortableKeys,
  UnwrapArray,
  WithoutRequestParams,
} from "./Types";

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
  ...argsWithToast: [
    ...WithoutRequestParams<Parameters<Import["uploadProductFiles"]>>,
    ToastOptions?,
    RequestParams?,
  ]
): Promise<
  ApiResult<ExtractResponse<ReturnType<Import["uploadProductFiles"]>>>
> {
  const { args, toastOptions, params } =
    extractArgsToastsAndParams<
      WithoutRequestParams<Parameters<Import["uploadProductFiles"]>>
    >(argsWithToast);

  const requestArgs = [...args, params ?? {}] as unknown as Parameters<
    Import["uploadProductFiles"]
  >;

  return handleApiResponse(
    () => importApi.uploadProductFiles(...requestArgs),
    toastOptions,
  );
}

export async function uploadSupplierFile(
  ...argsWithToast: [
    ...WithoutRequestParams<Parameters<Import["uploadSupplierFile"]>>,
    ToastOptions?,
    RequestParams?,
  ]
): Promise<
  ApiResult<ExtractResponse<ReturnType<Import["uploadSupplierFile"]>>>
> {
  const { args, toastOptions, params } =
    extractArgsToastsAndParams<
      WithoutRequestParams<Parameters<Import["uploadSupplierFile"]>>
    >(argsWithToast);

  const requestArgs = [...args, params ?? {}] as unknown as Parameters<
    Import["uploadSupplierFile"]
  >;

  return handleApiResponse(
    () => importApi.uploadSupplierFile(...requestArgs),
    toastOptions,
  );
}

export async function uploadMixedImport(
  ...argsWithToast: [
    ...WithoutRequestParams<Parameters<Import["uploadMixedImport"]>>,
    ToastOptions?,
    RequestParams?,
  ]
): Promise<
  ApiResult<ExtractResponse<ReturnType<Import["uploadMixedImport"]>>>
> {
  const { args, toastOptions, params } =
    extractArgsToastsAndParams<
      WithoutRequestParams<Parameters<Import["uploadMixedImport"]>>
    >(argsWithToast);

  const requestArgs = [...args, params ?? {}] as unknown as Parameters<
    Import["uploadMixedImport"]
  >;

  return handleApiResponse(
    () => importApi.uploadMixedImport(...requestArgs),
    toastOptions,
  );
}
