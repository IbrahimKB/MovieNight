import { RequestHandler } from "express";
import { z } from "zod";
import { ApiResponse, Release } from "../models/types";
import { withTransaction, generateId } from "../utils/storage";
import { justWatchService } from "../services/justwatch";
import { schedulerService } from "../services/scheduler";

// Get all releases from database
export const handleGetReleases: RequestHandler = async (req, res) => {
  try {
    const releases = await withTransaction(async (db) => {
      return db.releases.sort(
        (a, b) =>
          new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime(),
      );
    });

    const response: ApiResponse<Release[]> = {
      success: true,
      data: releases,
    };

    res.json(response);
  } catch (error) {
    console.error("Get releases error:", error);

    const response: ApiResponse = {
      success: false,
      error: "Internal server error",
    };
    res.status(500).json(response);
  }
};

// Sync releases from JustWatch (manual refresh)
export const handleSyncReleases: RequestHandler = async (req, res) => {
  try {
    const daysParam = req.query.days as string;
    const days = daysParam ? parseInt(daysParam) : 30;

    if (days < 1 || days > 90) {
      const response: ApiResponse = {
        success: false,
        error: "Days parameter must be between 1 and 90",
      };
      return res.status(400).json(response);
    }

    // Get releases from JustWatch
    const newReleases = await justWatchService.getUpcomingReleases(days);

    // Update database
    const result = await withTransaction(async (db) => {
      // Clear existing releases to avoid duplicates
      db.releases = [];

      // Add new releases
      db.releases.push(...newReleases);

      return {
        totalReleases: newReleases.length,
        syncTime: new Date().toISOString(),
        daysAhead: days,
      };
    });

    const rateLimitStatus = justWatchService.getRateLimitStatus();

    const response: ApiResponse<{
      result: typeof result;
      rateLimit: typeof rateLimitStatus;
    }> = {
      success: true,
      data: {
        result,
        rateLimit: rateLimitStatus,
      },
      message: `Successfully synced ${result.totalReleases} releases`,
    };

    res.json(response);
  } catch (error) {
    console.error("Sync releases error:", error);

    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync releases",
    };

    res.status(500).json(response);
  }
};

// Get upcoming releases for a specific time period
export const handleGetUpcomingReleases: RequestHandler = async (req, res) => {
  try {
    const period = req.query.period as string;
    const now = new Date();
    let endDate: Date;

    switch (period) {
      case "week":
        endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      case "quarter":
        endDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    const releases = await withTransaction(async (db) => {
      return db.releases
        .filter((release) => {
          const releaseDate = new Date(release.releaseDate);
          return releaseDate >= now && releaseDate <= endDate;
        })
        .sort(
          (a, b) =>
            new Date(a.releaseDate).getTime() -
            new Date(b.releaseDate).getTime(),
        );
    });

    const response: ApiResponse<Release[]> = {
      success: true,
      data: releases,
    };

    res.json(response);
  } catch (error) {
    console.error("Get upcoming releases error:", error);

    const response: ApiResponse = {
      success: false,
      error: "Internal server error",
    };
    res.status(500).json(response);
  }
};

// Get releases by platform
export const handleGetReleasesByPlatform: RequestHandler = async (req, res) => {
  try {
    const platform = req.query.platform as string;

    if (!platform) {
      const response: ApiResponse = {
        success: false,
        error: "Platform parameter is required",
      };
      return res.status(400).json(response);
    }

    const releases = await withTransaction(async (db) => {
      return db.releases
        .filter((release) =>
          release.platform
            .toLowerCase()
            .includes(platform.toLowerCase().trim()),
        )
        .sort(
          (a, b) =>
            new Date(a.releaseDate).getTime() -
            new Date(b.releaseDate).getTime(),
        );
    });

    const response: ApiResponse<Release[]> = {
      success: true,
      data: releases,
    };

    res.json(response);
  } catch (error) {
    console.error("Get releases by platform error:", error);

    const response: ApiResponse = {
      success: false,
      error: "Internal server error",
    };
    res.status(500).json(response);
  }
};

// Get JustWatch rate limit status
export const handleGetJustWatchStatus: RequestHandler = async (req, res) => {
  try {
    const rateLimitStatus = justWatchService.getRateLimitStatus();

    const response: ApiResponse = {
      success: true,
      data: rateLimitStatus,
    };

    res.json(response);
  } catch (error) {
    console.error("Get JustWatch status error:", error);

    const response: ApiResponse = {
      success: false,
      error: "Failed to get JustWatch status",
    };
    res.status(500).json(response);
  }
};

// Weekly sync endpoint (for cron jobs)
export const handleWeeklySync: RequestHandler = async (req, res) => {
  try {
    const syncResult = await justWatchService.syncWeeklyReleases();

    // Update database with new releases
    await withTransaction(async (db) => {
      // Add new releases, avoiding duplicates
      const existingTitles = new Set(db.releases.map((r) => r.title));

      syncResult.newReleases.forEach((release) => {
        if (!existingTitles.has(release.title)) {
          db.releases.push(release);
        }
      });

      // Sort by release date
      db.releases.sort(
        (a, b) =>
          new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime(),
      );
    });

    const response: ApiResponse = {
      success: true,
      data: syncResult,
      message: "Weekly sync completed successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Weekly sync error:", error);

    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Weekly sync failed",
    };
    res.status(500).json(response);
  }
};

// Get scheduler status (admin only)
export const handleGetSchedulerStatus: RequestHandler = async (req, res) => {
  try {
    const status = schedulerService.getStatus();

    const response: ApiResponse = {
      success: true,
      data: status,
    };

    res.json(response);
  } catch (error) {
    console.error("Get scheduler status error:", error);

    const response: ApiResponse = {
      success: false,
      error: "Failed to get scheduler status",
    };
    res.status(500).json(response);
  }
};

// Trigger manual weekly sync (admin only)
export const handleTriggerManualSync: RequestHandler = async (req, res) => {
  try {
    const result = await schedulerService.triggerWeeklySync();

    const response: ApiResponse = {
      success: result.success,
      data: result.data,
      message: result.message,
    };

    if (result.success) {
      res.json(response);
    } else {
      res.status(500).json(response);
    }
  } catch (error) {
    console.error("Manual sync trigger error:", error);

    const response: ApiResponse = {
      success: false,
      error: "Failed to trigger manual sync",
    };
    res.status(500).json(response);
  }
};
