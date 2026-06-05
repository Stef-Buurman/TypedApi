import { toast as reactToast } from "react-toastify";

function ToastContent({ title, message }: { title: string; message?: string }) {
  return (
    <div>
      <strong>{title}</strong>
      {message && <div>{message}</div>}
    </div>
  );
}

export const toast = {
  success(message: string, title = "Success!") {
    reactToast.success(<ToastContent title={title} message={message} />);
  },

  error(message: string, title = "Error!") {
    reactToast.error(<ToastContent title={title} message={message} />);
  },

  warning(message: string, title = "Warning!") {
    reactToast.warning(<ToastContent title={title} message={message} />);
  },

  info(message: string, title = "Info") {
    reactToast.info(<ToastContent title={title} message={message} />);
  },

  async errorResponse(error: Response | unknown) {
    let message = "Something went wrong.";

    try {
      if (error instanceof Response) {
        const text = await error.text();
        message = text || message;
      } else if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === "string") {
        message = error;
      } else if (error && typeof error === "object") {
        message = JSON.stringify(error);
      }
    } catch {
      // keep default message
    }

    reactToast.error(<ToastContent title="Error!" message={message} />);
  }
};