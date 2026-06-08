/**
 * Toast message shown after an API action.
 *
 * `title` is optional and `message` contains the main notification text.
 */
export type ToastMessage = {
  title?: string;
  message: string;
};

/**
 * Optional toast messages for API success and error states.
 *
 * Use this to show consistent notifications after typed API requests.
 */
export type ToastOptions = {
  toastSuccess?: ToastMessage;
  toastError?: ToastMessage;
};