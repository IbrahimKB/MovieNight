// MovieNight PWA Service Worker
const CACHE_NAME = "movienight-v1.1.0";
const STATIC_CACHE_NAME = "movienight-static-v1.1.0";
const DYNAMIC_CACHE_NAME = "movienight-dynamic-v1.1.0";

// Files to cache immediately (app shell)
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/movienight-favicon.svg",
  // Add critical CSS and JS files that will be generated
];

// API endpoints to cache dynamically
const CACHEABLE_API_ROUTES = [
  "/api/user/profile",
  "/api/movies/trending",
  "/api/releases",
  "/api/notifications",
];

// Cache strategies
const CACHE_STRATEGIES = {
  // App shell - cache first, fallback to network
  CACHE_FIRST: "cache-first",
  // API data - network first, fallback to cache
  NETWORK_FIRST: "network-first",
  // Images and media - cache first with stale-while-revalidate
  STALE_WHILE_REVALIDATE: "stale-while-revalidate",
};

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service worker installing...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log("Pre-caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Force service worker to become active immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("Failed to cache static assets:", error);
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service worker activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== CACHE_NAME
            ) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      }),
  );
});

// Fetch event - handle requests with appropriate caching strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip external requests (unless it's TMDB or other movie APIs we want to cache)
  if (url.origin !== self.location.origin) {
    // Cache external movie/image APIs
    if (
      url.hostname.includes("tmdb.org") ||
      url.hostname.includes("justwatch.com") ||
      url.pathname.includes("image") ||
      url.pathname.includes("poster")
    ) {
      event.respondWith(staleWhileRevalidate(request));
    }
    return;
  }

  // Route-specific caching strategies
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
  } else if (isAPIRequest(url.pathname)) {
    event.respondWith(networkFirst(request));
  } else if (isImageRequest(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
  } else {
    // Default: serve app shell for SPA routes
    event.respondWith(handleNavigationRequest(request));
  }
});

// Cache-first strategy (for static assets)
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error("Cache-first strategy failed:", error);
    return new Response("Offline - Asset not available", { status: 503 });
  }
}

// Network-first strategy (for API requests)
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log("Network failed, trying cache:", request.url);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline fallback for specific API endpoints
    return createOfflineFallback(request);
  }
}

// Stale-while-revalidate strategy (for images)
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Handle SPA navigation requests
async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Fallback to cached app shell (index.html)
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedApp = await cache.match("/");
    return cachedApp || new Response("App offline", { status: 503 });
  }
}

// Create offline fallback responses
function createOfflineFallback(request) {
  const url = new URL(request.url);

  if (url.pathname.includes("/api/notifications")) {
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (url.pathname.includes("/api/movies")) {
    return new Response(JSON.stringify({ movies: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Offline", { status: 503 });
}

// Utility functions
function isStaticAsset(pathname) {
  return (
    pathname.includes(".") &&
    (pathname.endsWith(".js") ||
      pathname.endsWith(".css") ||
      pathname.endsWith(".html") ||
      pathname.endsWith(".svg") ||
      pathname.endsWith(".woff2") ||
      pathname === "/manifest.json")
  );
}

function isAPIRequest(pathname) {
  return pathname.startsWith("/api/");
}

function isImageRequest(pathname) {
  return (
    pathname.includes("image") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".gif")
  );
}

// Background sync for when connection returns
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync-suggestions") {
    event.waitUntil(syncPendingSuggestions());
  }
});

async function syncPendingSuggestions() {
  // Sync any pending movie suggestions when back online
  const pendingData = await getStoredPendingData();
  if (pendingData.length > 0) {
    console.log("Syncing pending suggestions...");
    // Implementation would sync with server
  }
}

// Push notifications
self.addEventListener("push", (event) => {
  console.log("Push notification received:", event);

  let notificationData;

  try {
    notificationData = event.data ? event.data.json() : {};
  } catch (error) {
    console.error("Error parsing push notification data:", error);
    notificationData = {
      title: "MovieNight",
      body: "You have a new notification!",
      icon: "/icons/icon-192x192.svg",
    };
  }

  const options = {
    body: notificationData.body || "You have a new notification!",
    icon: notificationData.icon || "/icons/icon-192x192.svg",
    badge: notificationData.badge || "/icons/icon-72x72.svg",
    tag: notificationData.tag || "movienight-notification",
    requireInteraction: notificationData.requireInteraction || false,
    data: notificationData.data || {},
    image: notificationData.image,
    actions: getNotificationActions(notificationData.type),
    silent: false,
    timestamp: Date.now(),
  };

  const title = notificationData.title || "MovieNight";

  event.waitUntil(
    self.registration
      .showNotification(title, options)
      .then(() => {
        console.log("Notification displayed successfully");
        // Track notification display
        trackNotificationEvent("displayed", notificationData.type);
      })
      .catch((error) => {
        console.error("Failed to show notification:", error);
      }),
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event.notification.tag, event.action);

  event.notification.close();

  const notificationData = event.notification.data || {};
  const action = event.action;

  // Track notification interaction
  trackNotificationEvent("clicked", notificationData.type, action);

  let urlToOpen = "/";

  // Determine URL based on notification type and action
  if (action === "view" || !action) {
    switch (notificationData.type) {
      case "friend_request":
        urlToOpen = "/squad";
        break;
      case "movie_suggestion":
        urlToOpen = "/";
        break;
      case "movie_night_invite":
        urlToOpen = "/movie-night";
        break;
      case "movie_available":
        urlToOpen = "/watchlist";
        break;
      case "system_update":
        urlToOpen = "/";
        break;
      default:
        urlToOpen = "/";
    }
  } else if (action === "dismiss") {
    // Just close, no action needed
    return;
  }

  // Open the app or focus existing window
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            client.navigate(urlToOpen);
            return;
          }
        }

        // Open new window if none exists
        return clients.openWindow(urlToOpen);
      })
      .catch((error) => {
        console.error("Failed to handle notification click:", error);
      }),
  );
});

// Utility to get stored pending data
async function getStoredPendingData() {
  // This would integrate with IndexedDB or localStorage
  return [];
}

// Notification helper functions
function getNotificationActions(type) {
  const baseActions = [
    {
      action: "view",
      title: "View",
      icon: "/icons/icon-72x72.svg",
    },
    {
      action: "dismiss",
      title: "Dismiss",
    },
  ];

  switch (type) {
    case "friend_request":
      return [
        {
          action: "view",
          title: "View Request",
          icon: "/icons/icon-72x72.svg",
        },
        {
          action: "dismiss",
          title: "Later",
        },
      ];

    case "movie_suggestion":
      return [
        {
          action: "view",
          title: "View Movie",
          icon: "/icons/suggest-96x96.svg",
        },
        {
          action: "dismiss",
          title: "Not Interested",
        },
      ];

    case "movie_night_invite":
      return [
        {
          action: "view",
          title: "Join Night",
          icon: "/icons/movie-night-96x96.svg",
        },
        {
          action: "dismiss",
          title: "Can't Make It",
        },
      ];

    case "movie_available":
      return [
        {
          action: "view",
          title: "Watch Now",
          icon: "/icons/watchlist-96x96.svg",
        },
        {
          action: "dismiss",
          title: "Later",
        },
      ];

    default:
      return baseActions;
  }
}

function trackNotificationEvent(event, type, action) {
  try {
    // Store notification analytics
    const analytics = {
      event,
      type,
      action,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    };

    // In a real app, you might send this to an analytics endpoint
    console.log("Notification analytics:", analytics);

    // Store locally for later sync
    if ("indexedDB" in self) {
      // Could store in IndexedDB for offline analytics
    }
  } catch (error) {
    console.error("Failed to track notification event:", error);
  }
}

// Handle notification close events
self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event.notification.tag);

  const notificationData = event.notification.data || {};
  trackNotificationEvent("closed", notificationData.type);
});

console.log("MovieNight Service Worker loaded");
