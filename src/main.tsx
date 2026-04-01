import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Preload hero video immediately
const heroVideo = document.createElement("link");
heroVideo.rel = "preload";
heroVideo.as = "video";
heroVideo.type = "video/mp4";
heroVideo.href = "/videos/hajj-bg.mp4";
document.head.appendChild(heroVideo);

// Keep preview always fresh: remove SW + caches in preview/iframe/dev
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewOrDevHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (!isInIframe && !isPreviewOrDevHost) return;

    navigator.serviceWorker
      .getRegistrations()
      .then(async (registrations) => {
        await Promise.all(registrations.map((registration) => registration.unregister()));

        if ("caches" in window) {
          const keys = await window.caches.keys();
          await Promise.all(keys.map((key) => window.caches.delete(key)));
        }
      })
      .catch(() => {
        // Ignore cache cleanup failures in preview
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
