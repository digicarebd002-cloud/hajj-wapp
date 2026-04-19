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

// ─────────────────────────────────────────────────────────────
// PWA / Service Worker management
// ─────────────────────────────────────────────────────────────
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewOrDevHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com") ||
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// One-time cache buster — bump this string to force ALL devices to wipe
// stale service workers + caches the next time they open the app.
const CACHE_BUSTER_KEY = "hw_cache_buster_v5_2026_04_19_b";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    // Preview / iframe / dev → kill any SW + caches so we never see stale code
    if (isInIframe || isPreviewOrDevHost) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch { /* ignore */ }
      return;
    }

    // ── Production behaviour ──
    // 1) One-shot cache wipe for users still running an old SW from a previous build
    try {
      if (!localStorage.getItem(CACHE_BUSTER_KEY)) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        localStorage.setItem(CACHE_BUSTER_KEY, "1");
        // Hard reload so the freshly registered SW serves the latest build
        window.location.reload();
        return;
      }
    } catch { /* ignore */ }

    // 2) Auto-reload silently when a new SW takes control
    let hasReloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (hasReloaded) return;
      hasReloaded = true;
      window.location.reload();
    });

    // 3) Periodically check for updates (every 60s)
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        setInterval(() => reg.update().catch(() => {}), 60_000);
      }
    } catch { /* ignore */ }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
