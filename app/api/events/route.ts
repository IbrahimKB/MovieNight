import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCurrentUser, getUserExternalId } from '@/lib/auth';
import { ApiResponse, Event } from '@/types';

const CreateEventSchema = z.object({
  movieId: z.string().uuid(),
  date: z.string().datetime(),
  notes: z.string().optional(),
  participants: z.array(z.string()).optional(),
});

// Helper: map external user ID (puid) to internal user ID
async function mapExternalUserIdToInternal(externalId: string): Promise<string | null> {
  try {
    const result = await query(
      `SELECT id FROM auth."User" WHERE puid = $1 OR id = $1 LIMIT 1`,
      [externalId]
    );
    return result.rows.length > 0 ? result.rows[0].id : null;
  } catch (err) {
    console.error('Error mapping user ID:', err);
    return null;
  }
}

// Helper: map internal user ID to external (puid)
async function mapInternalUserIdToExternal(internalId: string): Promise<string> {
  try {
    const result = await query(
      `SELECT puid, id FROM auth."User" WHERE id = $1`,
      [internalId]
    );
    if (result.rows.length > 0) {
      return result.rows[0].puid || result.rows[0].id;
    }
    return internalId;
  } catch (err) {
    console.error('Error mapping user ID:', err);
    return internalId;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
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

    const body = await req.json();
    const validation = CreateEventSchema.safeParse(body);

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

    const { movieId, date, notes, participants } = validation.data;

    // Validate movie exists
    const movieResult = await query(
      `SELECT id FROM movienight."Movie" WHERE id = $1`,
      [movieId]
    );

    if (movieResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Movie not found',
        },
        { status: 404 }
      );
    }

    // Validate and map all participants to internal IDs
    const internalParticipants: string[] = [currentUser.id];
    const invalidUserIds: string[] = [];

    if (participants && participants.length > 0) {
      for (const participantId of participants) {
        const internalId = await mapExternalUserIdToInternal(participantId);
        if (!internalId) {
          invalidUserIds.push(participantId);
        } else if (!internalParticipants.includes(internalId)) {
          internalParticipants.push(internalId);
        }
      }
    }

    if (invalidUserIds.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid user IDs: ${invalidUserIds.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Create event
    const eventId = randomUUID();
    const now = new Date();
    const eventDate = new Date(date);

    await query(
      `INSERT INTO movienight."Event" (id, "movieId", "hostUserId", participants, date, notes, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        eventId,
        movieId,
        currentUser.id,
        JSON.stringify(internalParticipants),
        eventDate,
        notes || null,
        now,
        now,
      ]
    );

    // Convert internal participant IDs back to external for response
    const externalParticipants: string[] = [];
    for (const id of internalParticipants) {
      externalParticipants.push(await mapInternalUserIdToExternal(id));
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: eventId,
          movieId,
          hostUserId: getUserExternalId(currentUser),
          participants: externalParticipants,
          date: eventDate,
          notes: notes || null,
          createdAt: now,
          updatedAt: now,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Create event error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

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

    // Get events where user is host or in participants
    const result = await query(
      `SELECT e.id, e."movieId", e."hostUserId", e.participants, e.date, e.notes, e."createdAt", e."updatedAt",
              m.title as "movieTitle", m.poster as "moviePoster",
              h.username as "hostUsername", h.puid as "hostPuid"
       FROM movienight."Event" e
       LEFT JOIN movienight."Movie" m ON e."movieId" = m.id
       LEFT JOIN auth."User" h ON e."hostUserId" = h.id
       WHERE e."hostUserId" = $1 OR e.participants::text LIKE $2
       ORDER BY e.date ASC`,
      [currentUser.id, `%"${currentUser.id}"%`]
    );

    const events = await Promise.all(
      result.rows.map(async (row) => {
        const hostPuid = await mapInternalUserIdToExternal(row.hostUserId);
        const participants = JSON.parse(row.participants || '[]');
        const externalParticipants = await Promise.all(
          participants.map((id: string) => mapInternalUserIdToExternal(id))
        );

        return {
          id: row.id,
          movieId: row.movieId,
          movieTitle: row.movieTitle,
          moviePoster: row.moviePoster,
          hostUserId: hostPuid,
          hostUsername: row.hostUsername,
          participants: externalParticipants,
          date: row.date,
          notes: row.notes,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (err) {
    console.error('Get events error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
