import { RequestHandler } from "express";
import { z } from "zod";
import {
  ApiResponse,
  Friendship,
  SendFriendRequestRequest,
  RespondToFriendRequestRequest,
} from "../models/types.js";
import { generateId } from "../utils/storage.js";
import { sql } from "../db/sql.js";

// ---------------------------------------------------------------------------
// DB row types
// ---------------------------------------------------------------------------
interface DbFriendshipRow {
  id: string;
  userId1: string;
  userId2: string;
  requestedBy: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DbUserRow {
  id: string;
  puid: string | null;
  username: string;
  name: string | null;
}

interface DbNotificationRow {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  read: boolean;
  actionData: any | null;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------
const sendFriendRequestSchema = z.object({
  targetUserId: z.string().min(1, "Target user ID is required"),
});

const respondToFriendRequestSchema = z.object({
  friendshipId: z.string().min(1, "Friendship ID is required"),
  action: z.enum(["accept", "reject"]),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// We always treat IDs in the API as the public user id (auth."User".puid)
async function findUserByPublicId(userId: string): Promise<DbUserRow | null> {
  const result = await sql<DbUserRow>(
    `
    SELECT
      "id",
      "puid",
      "username",
      "name"
    FROM auth."User"
    WHERE "puid" = $1
    LIMIT 1;
    `,
    [userId],
  );

  return result.rows[0] ?? null;
}

async function getFriendDisplayUser(userId: string): Promise<DbUserRow | null> {
  // userId is a public id (puid)
  return findUserByPublicId(userId);
}

// ---------------------------------------------------------------------------
// Get user's friends
// ---------------------------------------------------------------------------
export const handleGetFriends: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.userId; // public id (puid)

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      return res.status(400).json(response);
    }

    // We store puid values in movienight."Friendship".userId1/userId2
    // Build a friend list by joining to auth."User"
    const result = await sql<
      {
        friendshipId: string;
        friendsSince: Date;
        friendId: string;
        username: string;
        name: string | null;
      }
    >(
      `
      SELECT
        f."id"        AS "friendshipId",
        f."createdAt" AS "friendsSince",
        u."puid"      AS "friendId",
        u."username"  AS "username",
        u."name"      AS "name"
      FROM movienight."Friendship" f
      JOIN auth."User" u
        ON u."puid" = CASE
          WHEN f."userId1" = $1 THEN f."userId2"
          ELSE f."userId1"
        END
      WHERE
        f."status" = 'accepted'
        AND ($1 = f."userId1" OR $1 = f."userId2")
      ORDER BY f."createdAt" ASC;
      `,
      [userId],
    );

    const friends = result.rows.map((row) => ({
      id: row.friendId,
      name: row.name ?? row.username,
      username: row.username,
      avatar: undefined,
      friendshipId: row.friendshipId,
      friendsSince: row.friendsSince.toISOString(),
    }));

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

// ---------------------------------------------------------------------------
// Get incoming friend requests
// ---------------------------------------------------------------------------
export const handleGetIncomingRequests: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.userId; // public id (puid)

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      return res.status(400).json(response);
    }

    // Incoming = pending where this user is the target (userId2)
    const result = await sql<
      {
        id: string;
        sentAt: Date;
        fromUserId: string;
        fromUsername: string;
        fromName: string | null;
      }
    >(
      `
      SELECT
        f."id"           AS "id",
        f."createdAt"    AS "sentAt",
        u."puid"         AS "fromUserId",
        u."username"     AS "fromUsername",
        u."name"         AS "fromName"
      FROM movienight."Friendship" f
      JOIN auth."User" u
        ON u."puid" = f."requestedBy"
      WHERE
        f."status" = 'pending'
        AND f."userId2" = $1;
      `,
      [userId],
    );

    const requests = result.rows.map((row) => ({
      id: row.id,
      fromUser: {
        id: row.fromUserId,
        name: row.fromName ?? row.fromUsername,
        username: row.fromUsername,
        avatar: undefined,
      },
      sentAt: row.sentAt.toISOString(),
    }));

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

// ---------------------------------------------------------------------------
// Get outgoing friend requests
// ---------------------------------------------------------------------------
export const handleGetOutgoingRequests: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.userId; // public id (puid)

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      return res.status(400).json(response);
    }

    // Outgoing = pending where this user is the requester
    const result = await sql<
      {
        id: string;
        sentAt: Date;
        toUserId: string;
        toUsername: string;
        toName: string | null;
      }
    >(
      `
      SELECT
        f."id"           AS "id",
        f."createdAt"    AS "sentAt",
        u."puid"         AS "toUserId",
        u."username"     AS "toUsername",
        u."name"         AS "toName"
      FROM movienight."Friendship" f
      JOIN auth."User" u
        ON u."puid" = CASE
          WHEN f."requestedBy" = $1 THEN
            CASE WHEN f."userId1" = $1 THEN f."userId2" ELSE f."userId1" END
          ELSE NULL
        END
      WHERE
        f."status" = 'pending'
        AND f."requestedBy" = $1;
      `,
      [userId],
    );

    const requests = result.rows.map((row) => ({
      id: row.id,
      toUser: {
        id: row.toUserId,
        name: row.toName ?? row.toUsername,
        username: row.toUsername,
        avatar: undefined,
      },
      sentAt: row.sentAt.toISOString(),
    }));

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

// ---------------------------------------------------------------------------
// Send friend request
// ---------------------------------------------------------------------------
export const handleSendFriendRequest: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.userId; // public id (puid)
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

    await sql("BEGIN");

    try {
      // Ensure target user exists (by public id)
      const targetUser = await findUserByPublicId(body.targetUserId);
      if (!targetUser) {
        throw new Error("Target user not found");
      }

      // Ensure current user exists (sanity check)
      const currentUser = await findUserByPublicId(userId);
      if (!currentUser) {
        throw new Error("Current user not found");
      }

      // Check existing friendship in either direction
      const existing = await sql<DbFriendshipRow>(
        `
        SELECT
          "id",
          "userId1",
          "userId2",
          "requestedBy",
          "status",
          "createdAt",
          "updatedAt"
        FROM movienight."Friendship"
        WHERE
          ("userId1" = $1 AND "userId2" = $2)
          OR ("userId1" = $2 AND "userId2" = $1)
        LIMIT 1;
        `,
        [userId, body.targetUserId],
      );

      const existingFriendship = existing.rows[0];

      if (existingFriendship) {
        if (existingFriendship.status === "accepted") {
          throw new Error("You are already friends with this user");
        }
        if (existingFriendship.status === "pending") {
          throw new Error("Friend request already sent or received");
        }
      }

      // Create new friendship request (store public IDs)
      const friendshipId = generateId();

      const inserted = await sql<DbFriendshipRow>(
        `
        INSERT INTO movienight."Friendship"
          ("id", "userId1", "userId2", "requestedBy", "status", "createdAt", "updatedAt")
        VALUES
          ($1, $2, $3, $4, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING
          "id",
          "userId1",
          "userId2",
          "requestedBy",
          "status",
          "createdAt",
          "updatedAt";
        `,
        [friendshipId, userId, body.targetUserId, userId],
      );

      const friendshipRow = inserted.rows[0];

      // Create notification for target user
      const notificationId = generateId();
      const displayName = currentUser.name ?? currentUser.username;

      await sql<DbNotificationRow>(
        `
        INSERT INTO movienight."Notification"
          ("id", "userId", "type", "title", "content", "read", "actionData", "createdAt", "updatedAt")
        VALUES
          (
            $1,
            $2,
            'friend_request',
            'New Friend Request',
            $3,
            false,
            $4::jsonb,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          );
        `,
        [
          notificationId,
          body.targetUserId,
          `${displayName} sent you a friend request`,
          JSON.stringify({
            userId,
            friendshipId: friendshipRow.id,
          }),
        ],
      );

      await sql("COMMIT");

      const friendship: Friendship = {
        id: friendshipRow.id,
        userId1: friendshipRow.userId1,
        userId2: friendshipRow.userId2,
        requestedBy: friendshipRow.requestedBy,
        status: friendshipRow.status as Friendship["status"],
        createdAt: friendshipRow.createdAt.toISOString(),
        updatedAt: friendshipRow.updatedAt.toISOString(),
      };

      const response: ApiResponse<Friendship> = {
        success: true,
        data: friendship,
        message: "Friend request sent successfully",
      };

      res.status(201).json(response);
    } catch (err) {
      await sql("ROLLBACK");
      console.error("Send friend request transaction error:", err);
      throw err;
    }
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

// ---------------------------------------------------------------------------
// Respond to friend request (accept/reject)
// ---------------------------------------------------------------------------
export const handleRespondToFriendRequest: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.userId; // public id (puid)
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

    await sql("BEGIN");

    try {
      // Load the friendship row
      const existing = await sql<DbFriendshipRow>(
        `
        SELECT
          "id",
          "userId1",
          "userId2",
          "requestedBy",
          "status",
          "createdAt",
          "updatedAt"
        FROM movienight."Friendship"
        WHERE "id" = $1
        LIMIT 1;
        `,
        [body.friendshipId],
      );

      const friendshipRow = existing.rows[0];

      if (!friendshipRow) {
        throw new Error("Friend request not found");
      }

      if (friendshipRow.status !== "pending") {
        throw new Error("Friend request has already been responded to");
      }

      const isParticipant =
        friendshipRow.userId1 === userId || friendshipRow.userId2 === userId;
      const isRequester = friendshipRow.requestedBy === userId;

      // Only the recipient (non-requester) can respond
      if (!isParticipant || isRequester) {
        throw new Error("You are not authorized to respond to this request");
      }

      const newStatus = body.action === "accept" ? "accepted" : "rejected";

      const updated = await sql<DbFriendshipRow>(
        `
        UPDATE movienight."Friendship"
        SET
          "status" = $2,
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = $1
        RETURNING
          "id",
          "userId1",
          "userId2",
          "requestedBy",
          "status",
          "createdAt",
          "updatedAt";
        `,
        [body.friendshipId, newStatus],
      );

      const updatedRow = updated.rows[0];

      // If accepted, notify the requester
      if (body.action === "accept") {
        const responder = await findUserByPublicId(userId);
        if (responder) {
          const notificationId = generateId();
          const displayName = responder.name ?? responder.username;

          await sql<DbNotificationRow>(
            `
            INSERT INTO movienight."Notification"
              ("id", "userId", "type", "title", "content", "read", "actionData", "createdAt", "updatedAt")
            VALUES
              (
                $1,
                $2,
                'friend_request',
                'Friend Request Accepted',
                $3,
                false,
                $4::jsonb,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
              );
            `,
            [
              notificationId,
              updatedRow.requestedBy,
              `${displayName} accepted your friend request`,
              JSON.stringify({
                userId,
                friendshipId: updatedRow.id,
              }),
            ],
          );
        }
      }

      await sql("COMMIT");

      const friendship: Friendship = {
        id: updatedRow.id,
        userId1: updatedRow.userId1,
        userId2: updatedRow.userId2,
        requestedBy: updatedRow.requestedBy,
        status: updatedRow.status as Friendship["status"],
        createdAt: updatedRow.createdAt.toISOString(),
        updatedAt: updatedRow.updatedAt.toISOString(),
      };

      const response: ApiResponse<Friendship> = {
        success: true,
        data: friendship,
        message: `Friend request ${body.action}ed successfully`,
      };

      res.json(response);
    } catch (err) {
      await sql("ROLLBACK");
      console.error("Respond to friend request transaction error:", err);
      throw err;
    }
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

// ---------------------------------------------------------------------------
// Remove friend
// ---------------------------------------------------------------------------
export const handleRemoveFriend: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.userId; // public id (puid)
    const friendshipId = req.params.friendshipId;

    if (!userId || !friendshipId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID and friendship ID are required",
      };
      return res.status(400).json(response);
    }

    await sql("BEGIN");

    try {
      const existing = await sql<DbFriendshipRow>(
        `
        SELECT
          "id",
          "userId1",
          "userId2",
          "requestedBy",
          "status",
          "createdAt",
          "updatedAt"
        FROM movienight."Friendship"
        WHERE "id" = $1
        LIMIT 1;
        `,
        [friendshipId],
      );

      const friendshipRow = existing.rows[0];

      if (!friendshipRow) {
        throw new Error("Friendship not found");
      }

      const isParticipant =
        friendshipRow.userId1 === userId || friendshipRow.userId2 === userId;

      if (!isParticipant) {
        throw new Error("You are not authorized to remove this friendship");
      }

      await sql(
        `
        DELETE FROM movienight."Friendship"
        WHERE "id" = $1;
        `,
        [friendshipId],
      );

      await sql("COMMIT");

      const response: ApiResponse = {
        success: true,
        message: "Friend removed successfully",
      };

      res.json(response);
    } catch (err) {
      await sql("ROLLBACK");
      console.error("Remove friend transaction error:", err);
      throw err;
    }
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
