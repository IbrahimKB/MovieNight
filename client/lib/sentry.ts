import * as Sentry from "@sentry/react";

export function initSentry() {
  // Only initialize if DSN is provided
  if (!import.meta.env.VITE_SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // Filter out common non-critical errors
      if (event.exception) {
        const error = event.exception.values?.[0];
        if (
          error?.type === "ChunkLoadError" ||
          error?.value?.includes("Loading chunk") ||
          error?.value?.includes("ResizeObserver loop limit exceeded")
        ) {
          return null;
        }
      }
      return event;
    },
  });
}

// Helper function to capture friendship-related errors
export function captureUserAction(
  action: string,
  userId?: string,
  extra?: any,
) {
  Sentry.addBreadcrumb({
    message: `User action: ${action}`,
    category: "user",
    data: {
      userId,
      ...extra,
    },
    level: "info",
  });
}

// Helper function for API errors
export function captureApiError(error: any, endpoint: string, userId?: string) {
  Sentry.withScope((scope) => {
    scope.setTag("api.endpoint", endpoint);
    scope.setContext("api", {
      endpoint,
      userId,
      timestamp: new Date().toISOString(),
    });

    if (error.response) {
      scope.setContext("response", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    }

    Sentry.captureException(error);
  });
}
