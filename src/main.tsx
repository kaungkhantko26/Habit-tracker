import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  const register = async () => {
    let refreshing = false;
    const registration = await navigator.serviceWorker.register("/sw.js");

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) {
        return;
      }

      refreshing = true;
      window.location.reload();
    });

    const wireUpdateFlow = (worker: ServiceWorker | null) => {
      if (!worker) {
        return;
      }

      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          worker.postMessage({ type: "SKIP_WAITING" });
        }
      });
    };

    wireUpdateFlow(registration.installing);
    registration.addEventListener("updatefound", () => {
      wireUpdateFlow(registration.installing);
    });

    const requestUpdate = () => {
      void registration.update();
    };

    window.addEventListener("focus", requestUpdate);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        requestUpdate();
      }
    });
  };

  window.addEventListener("load", () => {
    void register();
  });
}
