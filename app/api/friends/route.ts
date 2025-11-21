import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, getUserExternalId } from '@/lib/auth';
import { ApiResponse } from '@/types';

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Require authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthenticated',
        },
        { status: 401 }
      );
    }

    // Get accepted friendships
    const friendsResult = await query(
      `SELECT f.id, 
              CASE WHEN f."userId1" = $1 THEN f."userId2" ELSE f."userId1" END as "friendId",
              CASE WHEN f."userId1" = $1 THEN u2.username ELSE u1.username END as username,
              CASE WHEN f."userId1" = $1 THEN u2.puid ELSE u1.puid END as puid
       FROM movienight."Friendship" f
       LEFT JOIN auth."User" u1 ON f."userId1" = u1.id
       LEFT JOIN auth."User" u2 ON f."userId2" = u2.id
       WHERE (f."userId1" = $1 OR f."userId2" = $1) AND f.status = 'accepted'`,
      [currentUser.id]
    );

    // Get pending incoming friend requests
    const incomingResult = await query(
      `SELECT f.id, f."userId1" as "fromUserId", u.username, u.puid, f."createdAt"
       FROM movienight."Friendship" f
       LEFT JOIN auth."User" u ON f."userId1" = u.id
       WHERE f."userId2" = $1 AND f.status = 'pending'`,
      [currentUser.id]
    );

    // Get pending outgoing friend requests
    const outgoingResult = await query(
      `SELECT f.id, f."userId2" as "toUserId", u.username, u.puid, f."createdAt"
       FROM movienight."Friendship" f
       LEFT JOIN auth."User" u ON f."userId2" = u.id
       WHERE f."userId1" = $1 AND f.status = 'pending'`,
      [currentUser.id]
    );

    return NextResponse.json({
      success: true,
      data: {
        friends: friendsResult.rows.map((row) => ({
          id: row.id,
          userId: row.puid || row.friendId,
          username: row.username,
        })),
        incomingRequests: incomingResult.rows.map((row) => ({
          id: row.id,
          fromUserId: row.puid || row.fromUserId,
          username: row.username,
          createdAt: row.createdAt,
        })),
        outgoingRequests: outgoingResult.rows.map((row) => ({
          id: row.id,
          toUserId: row.puid || row.toUserId,
          username: row.username,
          createdAt: row.createdAt,
        })),
      },
    });
  } catch (err) {
    console.error('Get friends error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
