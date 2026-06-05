import { ToastOptions } from "../types/ToastTypes";
import { RuntimeRequestParams } from "../types/HttpResponse";

function isToastOptions(value: unknown): value is ToastOptions {
  return (
    typeof value === "object" &&
    value !== null &&
    ("toastSuccess" in value || "toastError" in value)
  );
}

function isRequestParams(value: unknown): value is RuntimeRequestParams {
  return typeof value === "object" && value !== null && !isToastOptions(value);
}

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