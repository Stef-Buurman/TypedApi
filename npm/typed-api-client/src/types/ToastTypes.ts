export type ToastMessage = {
  title?: string;
  message: string;
};

export type ToastOptions = {
  toastSuccess?: ToastMessage;
  toastError?: ToastMessage;
};