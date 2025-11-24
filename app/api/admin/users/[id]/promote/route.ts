import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const userId = params.id;

    await prisma.authUser.update({
      where: { id: userId },
      data: { role: 'admin' },
    });

    return NextResponse.json({
      success: true,
      message: 'User promoted to admin',
    });
  } catch (err) {
    console.error('Error promoting user:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
