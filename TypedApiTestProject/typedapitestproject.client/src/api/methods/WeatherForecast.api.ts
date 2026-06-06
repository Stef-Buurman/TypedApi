import {
  extractArgsToastsAndParams,
  handleApiResponse,
} from "typedapi-client-helpers";

import type { ApiResult, ToastOptions } from "typedapi-client-helpers";

import { WeatherForecast } from "../generated/WeatherForecast";

import type { RequestParams } from "../generated/http-client";

import type { ExtractResponse, WithoutRequestParams } from "./Types";

/* =======================
   Query Types
   ======================= */

/* =======================
   API Instance
   ======================= */
const weatherForecastApi = new WeatherForecast();

/* =======================
   Paginated Query Methods
   ======================= */

/* =======================
   Simple Query Methods
   ======================= */

/* =======================
   Non-Query Methods
   ======================= */
export async function get(
  ...argsWithToast: [
    ...WithoutRequestParams<Parameters<WeatherForecast["get"]>>,
    ToastOptions?,
    RequestParams?,
  ]
): Promise<ApiResult<ExtractResponse<ReturnType<WeatherForecast["get"]>>>> {
  const { args, toastOptions, params } =
    extractArgsToastsAndParams<
      WithoutRequestParams<Parameters<WeatherForecast["get"]>>
    >(argsWithToast);

  const requestArgs = [...args, params ?? {}] as unknown as Parameters<
    WeatherForecast["get"]
  >;

  return handleApiResponse(
    () => weatherForecastApi.get(...requestArgs),
    toastOptions,
  );
}
