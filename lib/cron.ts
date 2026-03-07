/**
 * Cron Job Scheduler
 * Runs background tasks at scheduled times
 * - 3:15 AM: Sync upcoming releases (for calendar)
 *
 * NOTE: This file uses require() for node-cron to avoid webpack bundling issues.
 * node-cron uses child_process which cannot be bundled by Next.js.
 */

import { syncUpcomingReleases } from "./sync/sync-upcoming-releases";
import { processPushQueueBatch } from "./push-notifications";

let isScheduled = false;

function getCron(): typeof import("node-cron") {
  // Dynamic require to avoid webpack bundling
  return require("node-cron");
}

export async function initCronJobs() {
  if (isScheduled) {
    console.log("[CRON] Jobs already scheduled");
    return;
  }

  console.log("[CRON] Initializing background jobs...");

  const cron = getCron();

  // Upcoming releases sync: Every day at 3:15 AM
  cron.schedule("15 3 * * *", async () => {
    console.log("[CRON] Triggering upcoming releases sync at 3:15 AM...");
    try {
      await syncUpcomingReleases();
      console.log("[CRON] Upcoming releases sync completed successfully");
    } catch (err) {
      console.error("[CRON] Upcoming releases sync error:", err);
    }
  });

  // Push delivery queue: every minute
  cron.schedule("* * * * *", async () => {
    try {
      const result = await processPushQueueBatch(50);
      if (result.processed > 0) {
        console.log(`[CRON] Push queue processed: ${result.processed}`);
      }
    } catch (err) {
      console.error("[CRON] Push queue processing error:", err);
    }
  });

  isScheduled = true;
  console.log("[CRON] Jobs scheduled:");
  console.log("[CRON]   - Upcoming releases: 3:15 AM daily");
  console.log("[CRON]   - Push queue: every minute");
}

export async function stopCronJobs() {
  console.log("[CRON] Stopping all cron jobs...");
  const cron = getCron();
  const tasksMap = cron.getTasks();
  if (tasksMap instanceof Map) {
    tasksMap.forEach((task) => {
      task.stop();
    });
  }
  isScheduled = false;
}

// For testing: run syncs immediately
export async function runSyncsNow() {
  console.log("[CRON] Running syncs immediately...");
  return await syncUpcomingReleases();
}
