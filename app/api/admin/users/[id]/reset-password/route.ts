import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Generate temporary password
    const temporaryPassword = randomBytes(8).toString('hex');
    const hashedPassword = await hash(temporaryPassword, 10);

    await prisma.authUser.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      temporaryPassword,
    });
  } catch (err) {
    console.error('Error resetting password:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
