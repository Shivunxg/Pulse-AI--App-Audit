import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { name } = body;

    if (name !== undefined && (typeof name !== 'string' || name.length > 100)) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: { ...(name !== undefined ? { name: name.trim() || null } : {}) },
    });

    return NextResponse.json({
      user: { id: updated.id, email: updated.email, name: updated.name },
    });
  } catch (err) {
    console.error('[profile] Update error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
