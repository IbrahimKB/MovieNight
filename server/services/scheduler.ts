import * as cron from "node-cron";
import { tmdbService } from "./tmdb";
import { withTransaction, generateId } from "../utils/storage";
import { Release } from "../models/types";

class SchedulerService {
  private weeklyReleasesCron: cron.ScheduledTask | null = null;

  public start() {
    console.log("🕐 Starting MovieNight scheduler service...");

    // Schedule weekly releases sync for every Monday at 1:00 AM
    // Cron format: "minute hour day-of-month month day-of-week"
    // "0 1 * * 1" means: minute=0, hour=1, any day of month, any month, Monday=1
    this.weeklyReleasesCron = cron.schedule(
      "0 1 * * 1",
      async () => {
        await this.performWeeklySync();
      },
      {
        timezone: "UTC", // Use UTC for consistency
      },
    );

    console.log(
      "✅ Weekly releases sync scheduled for every Monday at 1:00 AM UTC",
    );

    // Optional: Run a sync 30 seconds after startup for testing/initialization
    setTimeout(async () => {
      console.log("🚀 Running initial releases sync...");
      await this.performWeeklySync();
    }, 30000);
  }

  public stop() {
    console.log("⏹️ Stopping scheduler service...");

    if (this.weeklyReleasesCron) {
      this.weeklyReleasesCron.stop();
      this.weeklyReleasesCron.destroy();
      this.weeklyReleasesCron = null;
      console.log("✅ Weekly releases sync job stopped");
    }
  }

  private async performWeeklySync() {
    const startTime = new Date();
    console.log(
      `🔄 [${startTime.toISOString()}] Starting automatic weekly releases sync...`,
    );

    try {
      // Get releases from JustWatch for the next 30 days
      const syncResult = await justWatchService.syncWeeklyReleases();

      // Update database with new releases
      const dbResult = await withTransaction(async (db) => {
        // Store previous count for comparison
        const previousCount = db.releases.length;

        // Clear existing releases to avoid duplicates (we want fresh data)
        db.releases = [];

        // Add new releases
        db.releases.push(...syncResult.newReleases);

        // Sort by release date
        db.releases.sort(
          (a, b) =>
            new Date(a.releaseDate).getTime() -
            new Date(b.releaseDate).getTime(),
        );

        return {
          previousCount,
          newCount: db.releases.length,
          difference: db.releases.length - previousCount,
        };
      });

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      console.log(
        `✅ [${endTime.toISOString()}] Weekly sync completed successfully:`,
      );
      console.log(`   📊 Previous releases: ${dbResult.previousCount}`);
      console.log(`   📊 New releases: ${dbResult.newCount}`);
      console.log(
        `   📊 Difference: ${dbResult.difference > 0 ? "+" : ""}${dbResult.difference}`,
      );
      console.log(`   ⏱️  Duration: ${duration}ms`);
      console.log(
        `   🔥 Rate limit remaining: ${justWatchService.getRateLimitStatus().remaining}`,
      );

      // Log successful sync for monitoring
      this.logSyncEvent({
        type: "success",
        timestamp: endTime.toISOString(),
        releasesCount: dbResult.newCount,
        duration,
        rateLimitRemaining: justWatchService.getRateLimitStatus().remaining,
      });
    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      console.error(`❌ [${endTime.toISOString()}] Weekly sync failed:`, error);
      console.error(`   ⏱️  Duration: ${duration}ms`);

      // Log failed sync for monitoring
      this.logSyncEvent({
        type: "error",
        timestamp: endTime.toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        duration,
      });
    }
  }

  private logSyncEvent(event: {
    type: "success" | "error";
    timestamp: string;
    releasesCount?: number;
    duration: number;
    rateLimitRemaining?: number;
    error?: string;
  }) {
    // In a production environment, you might want to:
    // - Store these logs in a database
    // - Send notifications on failures
    // - Monitor performance metrics
    // - Integrate with logging services like Winston, Datadog, etc.

    const logEntry = {
      service: "releases-scheduler",
      ...event,
    };

    if (event.type === "success") {
      console.log("📋 Sync Event Logged:", JSON.stringify(logEntry, null, 2));
    } else {
      console.error("📋 Sync Error Logged:", JSON.stringify(logEntry, null, 2));
    }
  }

  // Manual trigger for testing or admin use
  public async triggerWeeklySync(): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      console.log("🔄 Manual weekly sync triggered by admin...");
      await this.performWeeklySync();
      return {
        success: true,
        message: "Weekly sync triggered successfully",
        data: {
          timestamp: new Date().toISOString(),
          nextScheduled: this.getNextScheduledRun(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Manual sync failed",
      };
    }
  }

  // Get info about the next scheduled run
  public getNextScheduledRun(): string | null {
    if (!this.weeklyReleasesCron) return null;

    // Calculate next Monday at 1:00 AM UTC
    const now = new Date();
    const nextMonday = new Date(now);

    // Get days until next Monday
    const daysUntilMonday = (1 + 7 - now.getUTCDay()) % 7;
    if (daysUntilMonday === 0 && now.getUTCHours() >= 1) {
      // If it's Monday and past 1 AM, schedule for next Monday
      nextMonday.setUTCDate(now.getUTCDate() + 7);
    } else {
      nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
    }

    nextMonday.setUTCHours(1, 0, 0, 0);

    return nextMonday.toISOString();
  }

  // Get scheduler status for admin dashboard
  public getStatus() {
    return {
      isRunning: this.weeklyReleasesCron ? true : false,
      nextScheduledRun: this.getNextScheduledRun(),
      schedule: "Every Monday at 1:00 AM UTC",
      timezone: "UTC",
      rateLimitStatus: justWatchService.getRateLimitStatus(),
    };
  }
}

export const schedulerService = new SchedulerService();
