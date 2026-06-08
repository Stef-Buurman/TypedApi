import { ToastContainer } from "react-toastify";

/**
 * Shared toast container for TypedApi UI notifications.
 *
 * Add this once near the root of the app to enable toast messages.
 */
export function TypedApiToastProvider() {
  return <ToastContainer position="bottom-right" />;
}