import { RequestHandler } from "express";
import { z } from "zod";
import {
  ApiResponse,
  Friendship,
  SendFriendRequestRequest,
  RespondToFriendRequestRequest,
} from "../models/types";
import { withTransaction, generateId } from "../utils/storage";

// Validation schemas
const sendFriendRequestSchema = z.object({
  targetUserId: z.string().min(1, "Target user ID is required"),
});

const respondToFriendRequestSchema = z.object({
  friendshipId: z.string().min(1, "Friendship ID is required"),
  action: z.enum(["accept", "reject"]),
});

// Get user's friends
export const handleGetFriends: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      return res.status(400).json(response);
    }

    const friends = await withTransaction(async (db) => {
      // Find accepted friendships
      const friendships = db.friendships.filter(
        (f) =>
          f.status === "accepted" &&
          (f.userId1 === userId || f.userId2 === userId),
      );

      // Get friend user data
      return friendships.map((friendship) => {
        const friendId =
          friendship.userId1 === userId
            ? friendship.userId2
            : friendship.userId1;
        const friend = db.users.find((u) => u.id === friendId);

        return {
          id: friend?.id,
          name: friend?.name,
          username: friend?.username,
          avatar: friend?.avatar,
          friendshipId: friendship.id,
          friendsSince: friendship.createdAt,
        };
      });
    });

    const response: ApiResponse = {
      success: true,
      data: friends,
    };

    res.json(response);
  } catch (error) {
    console.error("Get friends error:", error);

    const response: ApiResponse = {
      success: false,
      error: "Internal server error",
    };
    res.status(500).json(response);
  }
};

// Get incoming friend requests
export const handleGetIncomingRequests: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      return res.status(400).json(response);
    }

    const requests = await withTransaction(async (db) => {
      // Find pending requests sent to this user
      const incomingRequests = db.friendships.filter(
        (f) =>
          f.status === "pending" &&
          (f.userId2 === userId ||
            (f.userId1 === userId && f.requestedBy !== userId)),
      );

      // Get requester user data
      return incomingRequests.map((request) => {
        const requesterId = request.requestedBy;
        const requester = db.users.find((u) => u.id === requesterId);

        return {
          id: request.id,
          fromUser: {
            id: requester?.id,
            name: requester?.name,
            username: requester?.username,
            avatar: requester?.avatar,
          },
          sentAt: request.createdAt,
        };
      });
    });

    const response: ApiResponse = {
      success: true,
      data: requests,
    };

    res.json(response);
  } catch (error) {
    console.error("Get incoming requests error:", error);

    const response: ApiResponse = {
      success: false,
      error: "Internal server error",
    };
    res.status(500).json(response);
  }
};

// Get outgoing friend requests
export const handleGetOutgoingRequests: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      return res.status(400).json(response);
    }

    const requests = await withTransaction(async (db) => {
      // Find pending requests sent by this user
      const outgoingRequests = db.friendships.filter(
        (f) => f.status === "pending" && f.requestedBy === userId,
      );

      // Get target user data
      return outgoingRequests.map((request) => {
        const targetId =
          request.userId1 === userId ? request.userId2 : request.userId1;
        const target = db.users.find((u) => u.id === targetId);

        return {
          id: request.id,
          toUser: {
            id: target?.id,
            name: target?.name,
            username: target?.username,
            avatar: target?.avatar,
          },
          sentAt: request.createdAt,
        };
      });
    });

    const response: ApiResponse = {
      success: true,
      data: requests,
    };

    res.json(response);
  } catch (error) {
    console.error("Get outgoing requests error:", error);

    const response: ApiResponse = {
      success: false,
      error: "Internal server error",
    };
    res.status(500).json(response);
  }
};

// Send friend request
export const handleSendFriendRequest: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.userId;
    const body = sendFriendRequestSchema.parse(
      req.body,
    ) as SendFriendRequestRequest;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      return res.status(400).json(response);
    }

    if (userId === body.targetUserId) {
      const response: ApiResponse = {
        success: false,
        error: "Cannot send friend request to yourself",
      };
      return res.status(400).json(response);
    }

    const friendship = await withTransaction(async (db) => {
      // Check if target user exists
      const targetUser = db.users.find((u) => u.id === body.targetUserId);
      if (!targetUser) {
        throw new Error("Target user not found");
      }

      // Check if friendship already exists
      const existingFriendship = db.friendships.find(
        (f) =>
          (f.userId1 === userId && f.userId2 === body.targetUserId) ||
          (f.userId1 === body.targetUserId && f.userId2 === userId),
      );

      if (existingFriendship) {
        if (existingFriendship.status === "accepted") {
          throw new Error("You are already friends with this user");
        } else if (existingFriendship.status === "pending") {
          throw new Error("Friend request already sent or received");
        }
      }

      // Create new friendship request
      const friendship: Friendship = {
        id: generateId(),
        userId1: userId,
        userId2: body.targetUserId,
        status: "pending",
        requestedBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.friendships.push(friendship);

      // Create notification for target user
      const currentUser = db.users.find((u) => u.id === userId);
      const notification = {
        id: generateId(),
        userId: body.targetUserId,
        type: "friend_request" as const,
        title: "New Friend Request",
        content: `${currentUser?.name} sent you a friend request`,
        read: false,
        actionData: {
          userId: userId,
          friendshipId: friendship.id,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.notifications.push(notification);

      return friendship;
    });

    const response: ApiResponse<Friendship> = {
      success: true,
      data: friendship,
      message: "Friend request sent successfully",
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Send friend request error:", error);

    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
      return res.status(400).json(response);
    }

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

// Respond to friend request (accept/reject)
export const handleRespondToFriendRequest: RequestHandler = async (
  req,
  res,
) => {
  try {
    const userId = req.params.userId;
    const body = respondToFriendRequestSchema.parse(
      req.body,
    ) as RespondToFriendRequestRequest;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      return res.status(400).json(response);
    }

    const friendship = await withTransaction(async (db) => {
      // Find the friendship request
      const friendship = db.friendships.find((f) => f.id === body.friendshipId);

      if (!friendship) {
        throw new Error("Friend request not found");
      }

      if (friendship.status !== "pending") {
        throw new Error("Friend request has already been responded to");
      }

      // Verify user is authorized to respond (should be the recipient)
      const isRecipient =
        (friendship.userId2 === userId && friendship.requestedBy !== userId) ||
        (friendship.userId1 === userId && friendship.requestedBy !== userId);

      if (!isRecipient) {
        throw new Error("You are not authorized to respond to this request");
      }

      // Update friendship status
      friendship.status = body.action === "accept" ? "accepted" : "rejected";
      friendship.updatedAt = new Date().toISOString();

      // If accepted, create notification for requester
      if (body.action === "accept") {
        const responder = db.users.find((u) => u.id === userId);
        const notification = {
          id: generateId(),
          userId: friendship.requestedBy,
          type: "friend_request" as const,
          title: "Friend Request Accepted",
          content: `${responder?.name} accepted your friend request`,
          read: false,
          actionData: {
            userId: userId,
            friendshipId: friendship.id,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.notifications.push(notification);
      }

      return friendship;
    });

    const response: ApiResponse<Friendship> = {
      success: true,
      data: friendship,
      message: `Friend request ${body.action}ed successfully`,
    };

    res.json(response);
  } catch (error) {
    console.error("Respond to friend request error:", error);

    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
      return res.status(400).json(response);
    }

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

// Remove friend
export const handleRemoveFriend: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.userId;
    const friendshipId = req.params.friendshipId;

    if (!userId || !friendshipId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID and friendship ID are required",
      };
      return res.status(400).json(response);
    }

    await withTransaction(async (db) => {
      // Find the friendship
      const friendshipIndex = db.friendships.findIndex(
        (f) => f.id === friendshipId,
      );

      if (friendshipIndex === -1) {
        throw new Error("Friendship not found");
      }

      const friendship = db.friendships[friendshipIndex];

      // Verify user is part of this friendship
      if (friendship.userId1 !== userId && friendship.userId2 !== userId) {
        throw new Error("You are not authorized to remove this friendship");
      }

      // Remove the friendship
      db.friendships.splice(friendshipIndex, 1);
    });

    const response: ApiResponse = {
      success: true,
      message: "Friend removed successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Remove friend error:", error);

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
