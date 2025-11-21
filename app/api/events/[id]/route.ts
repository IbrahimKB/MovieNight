import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse, Event } from "@/types";

const UpdateEventSchema = z.object({
  date: z.string().datetime().optional(),
  notes: z.string().optional(),
  participants: z.array(z.string()).optional(),
});

// Helper: map external user ID (puid) to internal user ID
async function mapExternalUserIdToInternal(
  externalId: string,
): Promise<string | null> {
  try {
    const result = await query(
      `SELECT id FROM auth."User" WHERE puid = $1 OR id = $1 LIMIT 1`,
      [externalId],
    );
    return result.rows.length > 0 ? result.rows[0].id : null;
  } catch (err) {
    console.error("Error mapping user ID:", err);
    return null;
  }
}

// Helper: map internal user ID to external (puid)
async function mapInternalUserIdToExternal(
  internalId: string,
): Promise<string> {
  try {
    const result = await query(
      `SELECT puid, id FROM auth."User" WHERE id = $1`,
      [internalId],
    );
    if (result.rows.length > 0) {
      return result.rows[0].puid || result.rows[0].id;
    }
    return internalId;
  } catch (err) {
    console.error("Error mapping user ID:", err);
    return internalId;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<ApiResponse>> {
  try {
    // Require authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthenticated",
        },
        { status: 401 },
      );
    }

    const { id } = params;

    const result = await query(
      `SELECT e.id, e."movieId", e."hostUserId", e.participants, e.date, e.notes, e."createdAt", e."updatedAt",
              m.title as "movieTitle", m.poster as "moviePoster", m.year, m.description, m.genres,
              h.username as "hostUsername", h.puid as "hostPuid"
       FROM movienight."Event" e
       LEFT JOIN movienight."Movie" m ON e."movieId" = m.id
       LEFT JOIN auth."User" h ON e."hostUserId" = h.id
       WHERE e.id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Event not found",
        },
        { status: 404 },
      );
    }

    const event = result.rows[0];
    const participants = JSON.parse(event.participants || "[]");
    const externalParticipants = await Promise.all(
      participants.map((pid: string) => mapInternalUserIdToExternal(pid)),
    );

    // Check if user is host or participant
    const isHost = event.hostUserId === currentUser.id;
    const isParticipant = participants.includes(currentUser.id);

    if (!isHost && !isParticipant) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 403 },
      );
    }

    const hostPuid = await mapInternalUserIdToExternal(event.hostUserId);

    return NextResponse.json({
      success: true,
      data: {
        id: event.id,
        movieId: event.movieId,
        movieTitle: event.movieTitle,
        moviePoster: event.moviePoster,
        movieYear: event.year,
        movieDescription: event.description,
        movieGenres: event.genres,
        hostUserId: hostPuid,
        hostUsername: event.hostUsername,
        participants: externalParticipants,
        date: event.date,
        notes: event.notes,
        isHost,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      },
    });
  } catch (err) {
    console.error("Get event error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<ApiResponse>> {
  try {
    // Require authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthenticated",
        },
        { status: 401 },
      );
    }

    const { id } = params;

    // Check if event exists and user is host
    const eventResult = await query(
      `SELECT "hostUserId", participants FROM movienight."Event" WHERE id = $1`,
      [id],
    );

    if (eventResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Event not found",
        },
        { status: 404 },
      );
    }

    const event = eventResult.rows[0];

    // Only host can edit
    if (event.hostUserId !== currentUser.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Only the host can edit this event",
        },
        { status: 403 },
      );
    }

    const body = await req.json();
    const validation = UpdateEventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 },
      );
    }

    const data = validation.data;
    const updates: string[] = [];
    const values: any[] = [id];
    let paramIndex = 2;

    if (data.date !== undefined) {
      updates.push(`date = $${paramIndex++}`);
      values.push(new Date(data.date));
    }

    if (data.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(data.notes || null);
    }

    if (data.participants !== undefined) {
      // Validate and map all participants
      const internalParticipants: string[] = [currentUser.id];
      const invalidUserIds: string[] = [];

      for (const participantId of data.participants) {
        const internalId = await mapExternalUserIdToInternal(participantId);
        if (!internalId) {
          invalidUserIds.push(participantId);
        } else if (!internalParticipants.includes(internalId)) {
          internalParticipants.push(internalId);
        }
      }

      if (invalidUserIds.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid user IDs: ${invalidUserIds.join(", ")}`,
          },
          { status: 400 },
        );
      }

      updates.push(`participants = $${paramIndex++}`);
      values.push(JSON.stringify(internalParticipants));
    }

    if (updates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No fields to update",
        },
        { status: 400 },
      );
    }

    updates.push(`"updatedAt" = NOW()`);

    const sql = `UPDATE movienight."Event"
                 SET ${updates.join(", ")}
                 WHERE id = $1
                 RETURNING *`;

    const result = await query(sql, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update event",
        },
        { status: 500 },
      );
    }

    const updatedEvent = result.rows[0];
    const participants = JSON.parse(updatedEvent.participants || "[]");
    const externalParticipants = await Promise.all(
      participants.map((pid: string) => mapInternalUserIdToExternal(pid)),
    );

    return NextResponse.json({
      success: true,
      data: {
        id: updatedEvent.id,
        movieId: updatedEvent.movieId,
        hostUserId: await mapInternalUserIdToExternal(updatedEvent.hostUserId),
        participants: externalParticipants,
        date: updatedEvent.date,
        notes: updatedEvent.notes,
        createdAt: updatedEvent.createdAt,
        updatedAt: updatedEvent.updatedAt,
      },
    });
  } catch (err) {
    console.error("Update event error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<ApiResponse>> {
  try {
    // Require authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthenticated",
        },
        { status: 401 },
      );
    }

    const { id } = params;

    // Check if event exists and user is host
    const eventResult = await query(
      `SELECT "hostUserId" FROM movienight."Event" WHERE id = $1`,
      [id],
    );

    if (eventResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Event not found",
        },
        { status: 404 },
      );
    }

    const event = eventResult.rows[0];

    // Only host can delete
    if (event.hostUserId !== currentUser.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Only the host can delete this event",
        },
        { status: 403 },
      );
    }

    await query(`DELETE FROM movienight."Event" WHERE id = $1`, [id]);

    return NextResponse.json({
      success: true,
      data: { message: "Event deleted" },
    });
  } catch (err) {
    console.error("Delete event error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
