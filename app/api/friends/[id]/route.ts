import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { ApiResponse } from '@/types';

const UpdateFriendshipSchema = z.object({
  action: z.enum(['accept', 'reject', 'remove']),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
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

    const { id } = params;
    const body = await req.json();
    const validation = UpdateFriendshipSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const { action } = validation.data;

    // Get friendship
    const friendshipResult = await query(
      `SELECT * FROM movienight."Friendship" WHERE id = $1`,
      [id]
    );

    if (friendshipResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Friendship not found',
        },
        { status: 404 }
      );
    }

    const friendship = friendshipResult.rows[0];

    // Verify current user is involved in this friendship
    if (friendship.userId1 !== currentUser.id && friendship.userId2 !== currentUser.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 403 }
      );
    }

    if (action === 'accept') {
      // Only the recipient can accept
      if (
        (friendship.userId2 === currentUser.id && friendship.requestedBy === friendship.userId1) ||
        (friendship.userId1 === currentUser.id && friendship.requestedBy === friendship.userId2)
      ) {
        await query(
          `UPDATE movienight."Friendship" SET status = $1, "updatedAt" = NOW() WHERE id = $2`,
          ['accepted', id]
        );
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Only the recipient can accept this request',
          },
          { status: 403 }
        );
      }
    } else if (action === 'reject') {
      // Only the recipient can reject
      if (
        (friendship.userId2 === currentUser.id && friendship.requestedBy === friendship.userId1) ||
        (friendship.userId1 === currentUser.id && friendship.requestedBy === friendship.userId2)
      ) {
        await query(
          `UPDATE movienight."Friendship" SET status = $1, "updatedAt" = NOW() WHERE id = $2`,
          ['rejected', id]
        );
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Only the recipient can reject this request',
          },
          { status: 403 }
        );
      }
    } else if (action === 'remove') {
      // Both users can remove
      if (friendship.status !== 'accepted') {
        return NextResponse.json(
          {
            success: false,
            error: 'Can only remove accepted friendships',
          },
          { status: 400 }
        );
      }

      await query(`DELETE FROM movienight."Friendship" WHERE id = $1`, [id]);
    }

    return NextResponse.json({
      success: true,
      data: { message: `Friendship ${action}ed successfully` },
    });
  } catch (err) {
    console.error('Update friendship error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
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

    const { id } = params;

    // Get friendship
    const friendshipResult = await query(
      `SELECT * FROM movienight."Friendship" WHERE id = $1`,
      [id]
    );

    if (friendshipResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Friendship not found',
        },
        { status: 404 }
      );
    }

    const friendship = friendshipResult.rows[0];

    // Verify current user is involved
    if (friendship.userId1 !== currentUser.id && friendship.userId2 !== currentUser.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 403 }
      );
    }

    // Delete friendship
    await query(`DELETE FROM movienight."Friendship" WHERE id = $1`, [id]);

    return NextResponse.json({
      success: true,
      data: { message: 'Friendship removed' },
    });
  } catch (err) {
    console.error('Delete friendship error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
