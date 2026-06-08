import { ToastOptions } from "../types/ToastTypes";
import { RuntimeRequestParams } from "../types/HttpResponse";

/**
 * Checks whether an unknown argument contains toast configuration.
 *
 * Used to separate optional toast options from normal API arguments.
 */
function isToastOptions(value: unknown): value is ToastOptions {
  return (
    typeof value === "object" &&
    value !== null &&
    ("toastSuccess" in value || "toastError" in value)
  );
}

/**
 * Checks whether an unknown argument should be treated as runtime request params.
 *
 * Toast options are excluded so they are not accidentally passed as request params.
 */
function isRequestParams(value: unknown): value is RuntimeRequestParams {
  return typeof value === "object" && value !== null && !isToastOptions(value);
}

/**
 * Splits API wrapper arguments into actual API arguments, optional toast options,
 * and optional runtime request params.
 *
 * This allows generated wrapper methods to accept toast and request options
 * without changing the original API method arguments.
 */
export function extractArgsToastsAndParams<TArgs extends unknown[]>(
  argsWithToast: [...TArgs, ToastOptions?, RuntimeRequestParams?]
): {
  args: TArgs;
  toastOptions?: ToastOptions;
  params?: RuntimeRequestParams;
} {
  const args = [...argsWithToast] as unknown[];

  let toastOptions: ToastOptions | undefined;
  let params: RuntimeRequestParams | undefined;

  const lastArg = args[args.length - 1];

  if (isRequestParams(lastArg)) {
    params = lastArg;
    args.pop();
  }

  const newLastArg = args[args.length - 1];

  if (isToastOptions(newLastArg)) {
    toastOptions = newLastArg;
    args.pop();
  }

  return {
    args: args as TArgs,
    toastOptions,
    params
  };
}