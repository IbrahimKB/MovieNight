/**
 * Cron Job Scheduler
 * Runs background tasks at scheduled times
 * - 3:00 AM: Sync popular movies (for search/discovery)
 * - 3:15 AM: Sync upcoming releases (for calendar)
 */

import cron from "node-cron";
// import { syncPopularMovies } from "./sync/sync-popular-movies"; // REMOVED
import { syncUpcomingReleases } from "./sync/sync-upcoming-releases";
import type { ScheduledTask } from "node-cron";

let isScheduled = false;

export function initCronJobs() {
  if (isScheduled) {
    console.log("[CRON] Jobs already scheduled");
    return;
  }

  console.log("[CRON] Initializing background jobs...");

  // Popular movies sync removed – search is now TMDB-only.
  /*
  const popularMoviesJob = cron.schedule("0 3 * * *", async () => {
    console.log("[CRON] Triggering popular movies sync at 3:00 AM...");
    try {
      await syncPopularMovies();
    } catch (err) {
      console.error("[CRON] Popular movies sync error:", err);
    }
  });
  */

  // Upcoming releases sync: Every day at 3:15 AM (15 min after popular)
  // 15 3 * * * = at 3:15 AM every day
  const upcomingReleasesJob = cron.schedule("15 3 * * *", async () => {
    console.log("[CRON] Triggering upcoming releases sync at 3:15 AM...");
    try {
      await syncUpcomingReleases();
    } catch (err) {
      console.error("[CRON] Upcoming releases sync error:", err);
    }
  });

  isScheduled = true;

  console.log("[CRON] ✅ Jobs scheduled:");
  // console.log("[CRON]   - Popular movies: 3:00 AM daily");
  console.log("[CRON]   - Upcoming releases: 3:15 AM daily");

  return {
    // popularMoviesJob,
    upcomingReleasesJob,
  };
}

export function stopCronJobs() {
  console.log("[CRON] Stopping all cron jobs...");
  const tasksMap = cron.getTasks();
  if (tasksMap instanceof Map) {
    tasksMap.forEach((task: ScheduledTask) => {
      task.stop();
    });
  }
  isScheduled = false;
}

// For testing: run syncs immediately
export async function runSyncsNow() {
  console.log("[CRON] Running syncs immediately...");
  // await syncPopularMovies(); // REMOVED
  await syncUpcomingReleases();
}
