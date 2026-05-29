(function () {
  "use strict";

  var canRegisterServiceWorker =
    "serviceWorker" in navigator &&
    window.isSecureContext &&
    location.protocol !== "file:";

  if (!canRegisterServiceWorker) return;

  window.addEventListener("load", function () {
    navigator.serviceWorker.register("./sw.js").catch(function () {
      // The game remains playable if offline caching is unavailable.
    });
  });
}());
