/**
 * WebView / native app detection utilities
 */

const UA = typeof navigator !== "undefined" ? navigator.userAgent : "";

/** true when running inside the HajjWallet native shell */
export const isNativeApp = /HajjWalletApp\/\d/.test(UA);

/** platform inside native shell */
export const nativePlatform: "android" | "ios" | "web" =
  isNativeApp && /Android/i.test(UA)
    ? "android"
    : isNativeApp && /iOS|iPhone|iPad/i.test(UA)
    ? "ios"
    : "web";

/**
 * Trigger a file download that works in both browser and WebView.
 * In WebView the blob URL is opened in a new window so the native
 * layer can intercept and save.
 */
export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;

  if (isNativeApp) {
    // Native WebView: open URL so the download manager can pick it up
    window.open(url, "_blank");
  } else {
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
