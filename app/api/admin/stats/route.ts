import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthenticated' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const [totalUsers, totalAdmins, totalMovies, totalSuggestions, totalEvents] = await Promise.all([
      prisma.authUser.count(),
      prisma.authUser.count({ where: { role: 'admin' } }),
      prisma.movie.count(),
      prisma.suggestion.count(),
      prisma.event.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalAdmins,
        totalMovies,
        totalSuggestions,
        totalEvents,
      },
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
