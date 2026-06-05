import { ApiResult } from "../interfaces/ApiResult";
import { toast } from "../toast/toast";
import { HttpResponse } from "../types/HttpResponse";
import { ToastOptions } from "../types/ToastTypes";

let isHandlingUnauthorized = false;

function handleUnauthorized(): ApiResult<undefined> {
  if (isHandlingUnauthorized) {
    return {
      ok: false,
      status: 401,
      response: undefined,
      error: new Error("Unauthorized")
    };
  }

  isHandlingUnauthorized = true;

  localStorage.removeItem("loggedInUser");
  sessionStorage.clear();

  toast.error("Your session has expired. Please log in again.", "Session Expired");

  if (window.location.pathname !== "/login") {
    window.dispatchEvent(new Event("unauthorized"));
  }

  return {
    ok: false,
    status: 401,
    response: undefined,
    error: new Error("Unauthorized")
  };
}

export function resetUnauthorizedHandling() {
  isHandlingUnauthorized = false;
}

export async function handleApiResponse<T>(
  call: () => Promise<HttpResponse<T, unknown>>,
  toastOptions?: ToastOptions
): Promise<ApiResult<T>> {
  let response: HttpResponse<T, unknown> | undefined;

  try {
    response = await call();

    if (response.status === 401) {
      return handleUnauthorized() as ApiResult<T>;
    }

    let data: T | undefined;

    try {
      const textData = await response.text();
      data = textData ? (JSON.parse(textData) as T) : undefined;
    } catch {
      data = undefined;
    }

    if (response.ok) {
      if (toastOptions?.toastSuccess) {
        toast.success(
          toastOptions.toastSuccess.message,
          toastOptions.toastSuccess.title
        );
      }

      return {
        ok: true,
        status: response.status,
        response: data as T
      };
    }

    if (toastOptions?.toastError) {
      toast.error(
        toastOptions.toastError.message,
        toastOptions.toastError.title
      );
    } else {
      await toast.errorResponse(response);
    }

    return {
      ok: false,
      status: response.status,
      response: data,
      error: null
    };
  } catch (error) {
    const status = error instanceof Response ? error.status : response?.status ?? 0;

    if (status === 401) {
      return handleUnauthorized() as ApiResult<T>;
    }

    await toast.errorResponse(error);

    return {
      ok: false,
      status,
      response: undefined,
      error
    };
  }
}