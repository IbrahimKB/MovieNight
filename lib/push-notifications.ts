import webpush from "web-push";
import { prisma } from "@/lib/prisma";

export type NotificationPreferenceKey =
  | "friendRequests"
  | "suggestions"
  | "movieReleases";

export interface PushMessagePayload {
  title: string;
  body: string;
  url?: string;
  type?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

type QueuePayload = {
  payload: PushMessagePayload;
  preferenceKey?: NotificationPreferenceKey;
};

let vapidInitialized = false;
let vapidInitError: string | null = null;

function normalizeConfigValue(value: string | undefined) {
  return (value || "").trim().replace(/^"|"$/g, "");
}

function isPlaceholderValue(value: string) {
  const normalized = value.toLowerCase();
  return (
    normalized.includes("place_your_") ||
    normalized.includes("your_public_key_here") ||
    normalized.includes("your_private_key_here") ||
    normalized.includes("...place_")
  );
}

function isLikelyUrlSafeBase64(value: string) {
  return /^[A-Za-z0-9_-]+$/.test(value);
}

function getVapidConfig() {
  const publicKey = normalizeConfigValue(
    process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  );
  const privateKey = normalizeConfigValue(process.env.VAPID_PRIVATE_KEY);
  const subject =
    normalizeConfigValue(process.env.VAPID_SUBJECT) ||
    "mailto:admin@movie-night.co.uk";

  return { publicKey, privateKey, subject };
}

export function getPublicVapidKey(): string | null {
  const validationError = validateVapidConfig();
  if (validationError) return null;

  const { publicKey } = getVapidConfig();
  return publicKey || null;
}

function validateVapidConfig(): string | null {
  const { publicKey, privateKey } = getVapidConfig();

  if (!publicKey || !privateKey) {
    return "Push not configured (missing VAPID keys)";
  }

  if (isPlaceholderValue(publicKey) || isPlaceholderValue(privateKey)) {
    return "Push not configured (placeholder VAPID keys)";
  }

  if (!isLikelyUrlSafeBase64(publicKey) || !isLikelyUrlSafeBase64(privateKey)) {
    return "Push not configured (invalid VAPID key format)";
  }

  return null;
}

function ensureVapidInitialized(): boolean {
  if (vapidInitialized) return true;

  const validationError = validateVapidConfig();
  if (validationError) {
    vapidInitError = validationError;
    return false;
  }

  const { publicKey, privateKey, subject } = getVapidConfig();

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidInitialized = true;
    vapidInitError = null;
    return true;
  } catch (error: any) {
    vapidInitError = "Push not configured (invalid VAPID keys)";
    console.error("Invalid VAPID configuration:", error?.message || error);
    return false;
  }
}

async function canReceivePush(
  userId: string,
  preferenceKey?: NotificationPreferenceKey,
) {
  const prefs = await prisma.userNotificationPreferences.findUnique({
    where: { userId },
    select: {
      pushNotifications: true,
      friendRequests: true,
      suggestions: true,
      movieReleases: true,
    },
  });

  if (!prefs) return true;
  if (!prefs.pushNotifications) return false;
  if (!preferenceKey) return true;
  return prefs[preferenceKey];
}

export async function sendPushToUser(
  userId: string,
  payload: PushMessagePayload,
  preferenceKey?: NotificationPreferenceKey,
): Promise<{ sent: number; skipped: string | null }> {
  if (!ensureVapidInitialized()) {
    return { sent: 0, skipped: vapidInitError || "Push not configured" };
  }

  const allowed = await canReceivePush(userId, preferenceKey);
  if (!allowed) {
    return { sent: 0, skipped: "Push disabled by user settings" };
  }

  const subscriptions = await prisma.userPushSubscription.findMany({
    where: { userId },
    select: {
      endpoint: true,
      auth: true,
      p256dh: true,
    },
  });

  if (subscriptions.length === 0) {
    return { sent: 0, skipped: "No active push subscriptions" };
  }

  let sent = 0;
  const staleEndpoints: string[] = [];

  const wirePayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.svg",
    tag: payload.tag || "movienight-notification",
    type: payload.type || "general",
    data: {
      url: payload.url || "/",
      ...(payload.data || {}),
    },
  });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              auth: sub.auth,
              p256dh: sub.p256dh,
            },
          },
          wirePayload,
          {
            TTL: 60,
            urgency: "normal",
          },
        );
        sent += 1;
      } catch (error: any) {
        const statusCode = error?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          staleEndpoints.push(sub.endpoint);
        } else {
          console.error("Push send failed:", error);
        }
      }
    }),
  );

  if (staleEndpoints.length > 0) {
    await prisma.userPushSubscription.deleteMany({
      where: {
        endpoint: { in: staleEndpoints },
      },
    });
  }

  return { sent, skipped: null };
}

export async function enqueuePushToUser(
  userId: string,
  payload: PushMessagePayload,
  preferenceKey?: NotificationPreferenceKey,
) {
  await prisma.pushDeliveryJob.create({
    data: {
      userId,
      payload: payload as any,
      preferenceKey: preferenceKey ?? null,
      status: "queued",
      nextRunAt: new Date(),
    },
  });
}

function getNextRetryDelayMs(attempts: number) {
  // 1m, 2m, 4m, 8m...
  const base = 60 * 1000;
  return base * Math.pow(2, Math.max(0, attempts - 1));
}

export async function processPushQueueBatch(limit: number = 20) {
  const jobs = await prisma.pushDeliveryJob.findMany({
    where: {
      status: "queued",
      nextRunAt: { lte: new Date() },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let processed = 0;

  for (const job of jobs) {
    const lock = await prisma.pushDeliveryJob.updateMany({
      where: {
        id: job.id,
        status: "queued",
      },
      data: {
        status: "processing",
      },
    });

    if (lock.count === 0) {
      continue;
    }

    processed += 1;
    try {
      const queuePayload = job.payload as unknown as QueuePayload | PushMessagePayload;
      const isEnvelope =
        typeof (queuePayload as QueuePayload).payload === "object" &&
        !!(queuePayload as QueuePayload).payload;
      const payload = isEnvelope
        ? (queuePayload as QueuePayload).payload
        : (queuePayload as PushMessagePayload);
      const preferenceKey =
        (isEnvelope ? (queuePayload as QueuePayload).preferenceKey : job.preferenceKey) ||
        undefined;

      const result = await sendPushToUser(
        job.userId,
        payload,
        preferenceKey as NotificationPreferenceKey | undefined,
      );

      if (result.skipped) {
        await prisma.pushDeliveryJob.update({
          where: { id: job.id },
          data: {
            status: "failed",
            lastError: result.skipped,
          },
        });
        continue;
      }

      await prisma.pushDeliveryJob.update({
        where: { id: job.id },
        data: {
          status: "sent",
          sentAt: new Date(),
          lastError: null,
        },
      });
    } catch (err: any) {
      const nextAttempts = job.attempts + 1;
      const shouldRetry = nextAttempts < job.maxAttempts;
      await prisma.pushDeliveryJob.update({
        where: { id: job.id },
        data: {
          status: shouldRetry ? "queued" : "failed",
          attempts: nextAttempts,
          lastError: err?.message || "Unknown push delivery error",
          nextRunAt: shouldRetry
            ? new Date(Date.now() + getNextRetryDelayMs(nextAttempts))
            : job.nextRunAt,
        },
      });
    }
  }

  return { processed };
}
