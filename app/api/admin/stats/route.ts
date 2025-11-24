import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const [totalUsers, totalAdmins, totalMovies, totalSuggestions] = await Promise.all([
      prisma.authUser.count(),
      prisma.authUser.count({ where: { role: 'admin' } }),
      prisma.movie.count(),
      prisma.suggestion.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalAdmins,
        totalMovies,
        totalSuggestions,
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
