(function () {
  "use strict";

  var status = document.getElementById("offlineStatus");
  var canRegisterServiceWorker =
    "serviceWorker" in navigator &&
    window.isSecureContext &&
    location.protocol !== "file:";

  function setStatus(text, className) {
    if (!status) return;
    status.textContent = text;
    status.className = "offline-pill" + (className ? " " + className : "");
  }

  function askOfflineReady() {
    if (!navigator.serviceWorker.controller) return;
    navigator.serviceWorker.controller.postMessage({ type: "CHECK_OFFLINE_READY" });
  }

  function updateConnectionStatus() {
    if (!navigator.onLine) {
      setStatus("Offline", "is-offline");
      return;
    }
    askOfflineReady();
  }

  if (!canRegisterServiceWorker) {
    setStatus("Online");
    return;
  }

  window.addEventListener("online", updateConnectionStatus);
  window.addEventListener("offline", updateConnectionStatus);

  navigator.serviceWorker.addEventListener("message", function (event) {
    if (!event.data || event.data.type !== "OFFLINE_READY") return;
    setStatus(event.data.ready ? "Offline ready" : "Caching", event.data.ready ? "is-ready" : "");
  });

  navigator.serviceWorker.addEventListener("controllerchange", function () {
    askOfflineReady();
  });

  window.addEventListener("load", function () {
    navigator.serviceWorker.register("./sw.js").then(function () {
      return navigator.serviceWorker.ready;
    }).then(function () {
      askOfflineReady();
    }).catch(function () {
      setStatus("Online");
    });
  });
}());
