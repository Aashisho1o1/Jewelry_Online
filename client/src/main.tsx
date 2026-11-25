import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Customers just use the website: stop Chrome's own install bar (its menu can still add a shortcut).
window.addEventListener('beforeinstallprompt', event => event.preventDefault());

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    // Production: register service worker for PWA
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .catch((err) => console.error('SW registration failed:', err));
    });
  } else {
    // Development: unregister all service workers so they never cache dev files
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(r => r.unregister());
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
