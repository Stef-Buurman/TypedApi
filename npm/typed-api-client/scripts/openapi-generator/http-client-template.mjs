import { generatedFileHeader } from "./schema.mjs";

export function generateHttpClient(openApi, options = {}) {
  const baseUrl = options.baseUrl ?? openApi.servers?.[0]?.url ?? "";
  const runtimePackageName =
    options.runtimePackageName ?? "typedapi-client-helpers";

  return `${generatedFileHeader()}

import { createApiClient } from ${JSON.stringify(runtimePackageName)};

export { ContentType } from ${JSON.stringify(runtimePackageName)};

export type {
  ApiConfig,
  CancelToken,
  FullRequestParams,
  HttpResponse,
  QueryParamsType,
  RequestParams,
  ResponseFormat,
  RuntimeRequestParams,
} from ${JSON.stringify(runtimePackageName)};

const apiClient = createApiClient({
  baseUrl: ${JSON.stringify(baseUrl)},
});

export const configureApiClient = apiClient.configureApiClient;
export const setSecurityData = apiClient.setSecurityData;
export const abortRequest = apiClient.abortRequest;
export const request = apiClient.request;
`;
}