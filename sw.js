var CACHE_NAME = "maths-invaders-v5";
var OFFLINE_FALLBACK = "./index.html";
var CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./game.js",
  "./pwa.js",
  "./manifest.webmanifest"
];
var OPTIONAL_ASSETS = [
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./maths-icon-192.png",
  "./maths-icon-512.png",
  "./apple-touch-icon.svg",
  "./apple-touch-icon.png",
  "./maths-apple-touch-icon.png"
];
var APP_SHELL = CORE_ASSETS.concat(OPTIONAL_ASSETS);

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return Promise.all(APP_SHELL.map(function (url) {
        return cache.add(new Request(url, { cache: "reload" })).catch(function () {
          return Promise.resolve();
        });
      }));
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key !== CACHE_NAME) return caches.delete(key);
        return Promise.resolve();
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("message", function (event) {
  if (!event.data || event.data.type !== "CHECK_OFFLINE_READY") return;

  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return Promise.all(CORE_ASSETS.map(function (url) {
        return cache.match(url);
      }));
    }).then(function (matches) {
      var ready = matches.every(Boolean);
      if (event.source) {
        event.source.postMessage({
          type: "OFFLINE_READY",
          ready: ready
        });
      }
    })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).then(function (response) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(OFFLINE_FALLBACK, copy);
        });
        return response;
      }).catch(function () {
        return caches.match(OFFLINE_FALLBACK);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;

      return fetch(event.request).then(function (response) {
        if (response && response.ok) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, copy);
          });
        }
        return response;
      }).catch(function () {
        return new Response("", {
          status: 504,
          statusText: "Offline asset unavailable"
        });
      });
    })
  );
});
