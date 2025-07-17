import * as Sentry from "@sentry/react";

export function initSentry() {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN || "", // Add your Sentry DSN
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay({
        // Capture 10% of all sessions for replay
        sessionSampleRate: 0.1,
        // Capture 100% of sessions with an error for replay
        errorSampleRate: 1.0,
      }),
    ],
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
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
