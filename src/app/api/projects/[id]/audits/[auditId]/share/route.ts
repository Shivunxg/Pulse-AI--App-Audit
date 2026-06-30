import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

function generateSlug(): string {
  return randomBytes(6).toString('base64url');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; auditId: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { id, auditId } = await params;
    const audit = await db.audit.findFirst({
      where: { id: auditId, projectId: id, project: { userId: user.id } },
    });
    if (!audit) return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    if (audit.status !== 'completed') {
      return NextResponse.json({ error: 'Only completed audits can be shared' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const makePublic = body.public !== false;

    let slug = (audit as any).publicSlug;
    if (makePublic && !slug) {
      for (let i = 0; i < 5; i++) {
        const candidate = generateSlug();
        const existing = await db.audit.findFirst({ where: { publicSlug: candidate } as any });
        if (!existing) { slug = candidate; break; }
      }
      if (!slug) return NextResponse.json({ error: 'Could not generate a unique link, try again' }, { status: 500 });
    }

    const updated = await db.audit.update({
      where: { id: auditId },
      data: {
        isPublic: makePublic,
        ...(makePublic ? { publicSlug: slug } : {}),
      } as any,
    });

    return NextResponse.json({
      isPublic: (updated as any).isPublic,
      publicSlug: (updated as any).publicSlug,
      shareUrl: (updated as any).publicSlug
        ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-ai-app-audit.vercel.app'}/r/${(updated as any).publicSlug}`
        : null,
    });
  } catch (err) {
    console.error('[share] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
