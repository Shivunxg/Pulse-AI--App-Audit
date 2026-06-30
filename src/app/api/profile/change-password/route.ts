import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, hashPassword, verifyPassword } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (dbUser.passwordHash === '__firebase__') {
      return NextResponse.json(
        { error: 'Your account uses Google Sign-In. Manage your password through your Google Account settings.' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }

    const valid = await verifyPassword(currentPassword, dbUser.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    const newHash = await hashPassword(newPassword);
    await db.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[change-password] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
