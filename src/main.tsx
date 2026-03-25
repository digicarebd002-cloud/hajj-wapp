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

// Register PWA service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // SW registration failed silently
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
