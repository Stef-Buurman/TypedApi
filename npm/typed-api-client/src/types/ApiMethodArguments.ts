import { RuntimeRequestParams } from "./HttpResponse";

export type ApiMethodArguments<
  TMethod extends (...args: any[]) => unknown,
  TRequestParams = RuntimeRequestParams,
> =
  Parameters<TMethod> extends [
    ...infer Arguments,
    TRequestParams?,
  ]
    ? Arguments
    : Parameters<TMethod>;