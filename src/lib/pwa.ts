type Listener = () => void;

const listeners = new Set<Listener>();
let pendingRegistration: ServiceWorkerRegistration | null = null;
let hasPendingUpdate = false;

function notifyUpdateReady() {
  hasPendingUpdate = true;
  listeners.forEach((listener) => listener());
}

export function subscribeToPwaUpdate(listener: Listener) {
  listeners.add(listener);

  if (hasPendingUpdate) {
    listener();
  }

  return () => {
    listeners.delete(listener);
  };
}

export function applyPwaUpdate() {
  pendingRegistration?.waiting?.postMessage({ type: "SKIP_WAITING" });
}

export function registerPwa() {
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) {
    return;
  }

  window.addEventListener("load", () => {
    void (async () => {
      let refreshing = false;
      const registration = await navigator.serviceWorker.register("/sw.js");

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) {
          return;
        }

        refreshing = true;
        window.location.reload();
      });

      const flagPendingUpdate = () => {
        if (registration.waiting && navigator.serviceWorker.controller) {
          pendingRegistration = registration;
          notifyUpdateReady();
        }
      };

      const wireWorker = (worker: ServiceWorker | null) => {
        if (!worker) {
          return;
        }

        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            pendingRegistration = registration;
            notifyUpdateReady();
          }
        });
      };

      flagPendingUpdate();
      wireWorker(registration.installing);

      registration.addEventListener("updatefound", () => {
        wireWorker(registration.installing);
      });

      const requestUpdate = () => {
        void registration.update().then(flagPendingUpdate);
      };

      window.addEventListener("focus", requestUpdate);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          requestUpdate();
        }
      });
    })();
  });
}
