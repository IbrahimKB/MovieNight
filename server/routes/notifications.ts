import { RequestHandler } from "express";
import { z } from "zod";
import { ApiResponse, Notification } from "../models/types";
import { withTransaction } from "../utils/storage";

// Validation schemas
const markAsReadSchema = z.object({
  notificationIds: z.array(z.string()).optional(),
});

// Get user's notifications
export const handleGetNotifications: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.userId;
    const unreadOnly = req.query.unreadOnly === "true";

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      return res.status(400).json(response);
    }

    const notifications = await withTransaction(async (db) => {
      let userNotifications = db.notifications.filter(
        (n) => n.userId === userId,
      );

      if (unreadOnly) {
        userNotifications = userNotifications.filter((n) => !n.read);
      }

      // Sort by creation date (newest first)
      return userNotifications.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    });

    const response: ApiResponse<Notification[]> = {
      success: true,
      data: notifications,
    };

    res.json(response);
  } catch (error) {
    console.error("Get notifications error:", error);

    const response: ApiResponse = {
      success: false,
      error: "Internal server error",
    };
    res.status(500).json(response);
  }
};

// Get unread notification count
export const handleGetUnreadCount: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      return res.status(400).json(response);
    }

    const count = await withTransaction(async (db) => {
      return db.notifications.filter((n) => n.userId === userId && !n.read)
        .length;
    });

    const response: ApiResponse<{ count: number }> = {
      success: true,
      data: { count },
    };

    res.json(response);
  } catch (error) {
    console.error("Get unread count error:", error);

    const response: ApiResponse = {
      success: false,
      error: "Internal server error",
    };
    res.status(500).json(response);
  }
};

// Mark notifications as read
export const handleMarkAsRead: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.userId;
    const body = markAsReadSchema.parse(req.body);

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      return res.status(400).json(response);
    }

    const updatedCount = await withTransaction(async (db) => {
      let updatedCount = 0;

      if (body.notificationIds && body.notificationIds.length > 0) {
        // Mark specific notifications as read
        db.notifications.forEach((notification) => {
          if (
            notification.userId === userId &&
            body.notificationIds!.includes(notification.id) &&
            !notification.read
          ) {
            notification.read = true;
            notification.updatedAt = new Date().toISOString();
            updatedCount++;
          }
        });
      } else {
        // Mark all user's notifications as read
        db.notifications.forEach((notification) => {
          if (notification.userId === userId && !notification.read) {
            notification.read = true;
            notification.updatedAt = new Date().toISOString();
            updatedCount++;
          }
        });
      }

      return updatedCount;
    });

    const response: ApiResponse<{ updatedCount: number }> = {
      success: true,
      data: { updatedCount },
      message: `${updatedCount} notification${updatedCount !== 1 ? "s" : ""} marked as read`,
    };

    res.json(response);
  } catch (error) {
    console.error("Mark as read error:", error);

    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
      return res.status(400).json(response);
    }

    const response: ApiResponse = {
      success: false,
      error: "Internal server error",
    };
    res.status(500).json(response);
  }
};

// Delete notification
export const handleDeleteNotification: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.userId;
    const notificationId = req.params.notificationId;

    if (!userId || !notificationId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID and notification ID are required",
      };
      return res.status(400).json(response);
    }

    const deleted = await withTransaction(async (db) => {
      const notificationIndex = db.notifications.findIndex(
        (n) => n.id === notificationId && n.userId === userId,
      );

      if (notificationIndex === -1) {
        throw new Error("Notification not found");
      }

      // Remove the notification
      db.notifications.splice(notificationIndex, 1);
      return true;
    });

    const response: ApiResponse = {
      success: true,
      message: "Notification deleted successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Delete notification error:", error);

    if (error instanceof Error) {
      const response: ApiResponse = {
        success: false,
        error: error.message,
      };
      return res.status(400).json(response);
    }

    const response: ApiResponse = {
      success: false,
      error: "Internal server error",
    };
    res.status(500).json(response);
  }
};

// Clear all notifications for user
export const handleClearAllNotifications: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      return res.status(400).json(response);
    }

    const deletedCount = await withTransaction(async (db) => {
      const userNotifications = db.notifications.filter(
        (n) => n.userId === userId,
      );
      const deletedCount = userNotifications.length;

      // Remove all user's notifications
      db.notifications = db.notifications.filter((n) => n.userId !== userId);

      return deletedCount;
    });

    const response: ApiResponse<{ deletedCount: number }> = {
      success: true,
      data: { deletedCount },
      message: `${deletedCount} notification${deletedCount !== 1 ? "s" : ""} cleared`,
    };

    res.json(response);
  } catch (error) {
    console.error("Clear all notifications error:", error);

    const response: ApiResponse = {
      success: false,
      error: "Internal server error",
    };
    res.status(500).json(response);
  }
};
