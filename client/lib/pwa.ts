// PWA Service Worker Registration and Management

const isProduction = import.meta.env.PROD;
const swPath = "/sw.js";

// Register service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.log("Service Worker not supported");
    return null;
  }

  try {
    console.log("Registering service worker...");
    const registration = await navigator.serviceWorker.register(swPath, {
      scope: "/",
      updateViaCache: "none", // Always check for updates
    });

    console.log("Service Worker registered successfully:", registration);

    // Handle updates
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed") {
          if (navigator.serviceWorker.controller) {
            // New update available
            console.log("New app version available");
            showUpdateAvailable();
          } else {
            // First time install
            console.log("App is ready for offline use");
            showAppReady();
          }
        }
      });
    });

    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return null;
  }
}

// Unregister service worker (for development)
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const unregistered = await registration.unregister();
      console.log("Service Worker unregistered:", unregistered);
      return unregistered;
    }
    return true;
  } catch (error) {
    console.error("Service Worker unregistration failed:", error);
    return false;
  }
}

// Check if app is running in PWA mode
export function isPWAMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone ||
    document.referrer.includes("android-app://")
  );
}

// Check if app can be installed
export function canInstallPWA(): boolean {
  return "BeforeInstallPromptEvent" in window;
}

// Show update available notification
function showUpdateAvailable(): void {
  // Create a simple notification for update
  const event = new CustomEvent("pwa-update-available", {
    detail: { message: "New version available! Refresh to update." },
  });
  window.dispatchEvent(event);
}

// Show app ready notification
function showAppReady(): void {
  const event = new CustomEvent("pwa-app-ready", {
    detail: { message: "App is ready for offline use!" },
  });
  window.dispatchEvent(event);
}

// Force update service worker
export async function updateServiceWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      console.log("Service Worker update triggered");
    }
  } catch (error) {
    console.error("Service Worker update failed:", error);
  }
}

// Get service worker registration
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.getRegistration();
  } catch (error) {
    console.error("Failed to get Service Worker registration:", error);
    return null;
  }
}

// Listen for service worker messages
export function listenForSWMessages(callback: (message: any) => void): void {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  navigator.serviceWorker.addEventListener("message", (event) => {
    callback(event.data);
  });
}

// Send message to service worker
export async function sendSWMessage(message: any): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration && registration.active) {
    registration.active.postMessage(message);
  }
}

// PWA app shortcuts management
export function handlePWAShortcuts(): void {
  // Handle keyboard shortcuts for PWA
  document.addEventListener("keydown", (event) => {
    // Cmd/Ctrl + K for search
    if ((event.metaKey || event.ctrlKey) && event.key === "k") {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent("open-search"));
    }

    // Cmd/Ctrl + N for new suggestion
    if ((event.metaKey || event.ctrlKey) && event.key === "n") {
      event.preventDefault();
      window.location.href = "/suggest";
    }

    // Cmd/Ctrl + W for watchlist
    if ((event.metaKey || event.ctrlKey) && event.key === "w") {
      event.preventDefault();
      window.location.href = "/watchlist";
    }
  });
}

// Initialize PWA features
export async function initializePWA(): Promise<void> {
  console.log("Initializing PWA features...");

  // Register service worker in production
  if (isProduction) {
    await registerServiceWorker();
  }

  // Handle PWA shortcuts
  handlePWAShortcuts();

  // Add PWA-specific styles
  if (isPWAMode()) {
    document.body.classList.add("pwa-mode");
  }

  // Listen for app installation
  window.addEventListener("appinstalled", () => {
    console.log("PWA was installed successfully");
    // Track installation event
    gtag?.("event", "pwa_install", {
      event_category: "PWA",
      event_label: "app_installed",
    });
  });

  console.log("PWA initialization complete");
}

// Cache management utilities
export async function clearPWACache(): Promise<void> {
  if (!("caches" in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((cacheName) => {
        console.log("Deleting cache:", cacheName);
        return caches.delete(cacheName);
      }),
    );
    console.log("All caches cleared");
  } catch (error) {
    console.error("Failed to clear caches:", error);
  }
}

// Get cache storage information
export async function getCacheInfo(): Promise<{
  cacheNames: string[];
  totalSize: number;
}> {
  if (!("caches" in window)) {
    return { cacheNames: [], totalSize: 0 };
  }

  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;

    // Note: Getting cache size is complex and not directly supported
    // This is a simplified approach
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      totalSize += requests.length; // Approximate
    }

    return { cacheNames, totalSize };
  } catch (error) {
    console.error("Failed to get cache info:", error);
    return { cacheNames: [], totalSize: 0 };
  }
}

// PWA analytics helpers
export function trackPWAEvent(action: string, label?: string): void {
  // Track PWA-specific events
  if (typeof gtag !== "undefined") {
    gtag("event", action, {
      event_category: "PWA",
      event_label: label,
    });
  }
}

declare global {
  function gtag(...args: any[]): void;
}
