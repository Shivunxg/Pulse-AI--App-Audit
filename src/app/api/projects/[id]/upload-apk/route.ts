import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { runAndroidAudit } from '@/lib/android-audit';
import { generateAndroidAiSummary } from '@/lib/ai-summary';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const project = await db.project.findFirst({ where: { id, userId: user.id } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.type !== 'android') {
      return NextResponse.json({ error: 'This endpoint is for Android projects only' }, { status: 400 });
    }

    const formData = await request.formData();
    const apkFile = formData.get('apk') as File | null;

    if (!apkFile) {
      return NextResponse.json({ error: 'No APK file provided' }, { status: 400 });
    }

    if (!apkFile.name.endsWith('.apk')) {
      return NextResponse.json({ error: 'File must be an .apk file' }, { status: 400 });
    }

    // Size limit: 500MB
    if (apkFile.size > 500 * 1024 * 1024) {
      return NextResponse.json({ error: 'APK file too large (max 500MB)' }, { status: 400 });
    }

    // Create audit record
    const audit = await db.audit.create({
      data: { projectId: id, status: 'running', mode: 'deep' },
    });

    // Read file buffer
    const apkBuffer = Buffer.from(await apkFile.arrayBuffer());

    // Save APK to uploads directory for reference
    const uploadDir = path.join(process.cwd(), 'uploads', 'apk');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    const apkPath = path.join(uploadDir, `${audit.id}.apk`);
    await writeFile(apkPath, apkBuffer);

    // Run audit asynchronously
    (async () => {
      try {
        const result = await runAndroidAudit(apkBuffer, apkFile.size);

        let aiSummaryJson = '{}';
        try {
          const aiSummary = await generateAndroidAiSummary(result.findings, project.name);
          aiSummaryJson = JSON.stringify(aiSummary);
        } catch (aiErr) {
          console.error('Android AI summary error:', aiErr);
        }

        await db.audit.update({
          where: { id: audit.id },
          data: {
            status: 'completed',
            healthScore: result.healthScore,
            performanceScore: result.performanceScore,
            seoScore: result.seoScore,
            accessibilityScore: result.accessibilityScore,
            securityScore: result.securityScore,
            uxScore: result.uxScore,
            findings: JSON.stringify(result.findings),
            aiSummary: aiSummaryJson,
            responseTime: result.responseTime,
            pageSize: result.pageSize,
          },
        });
      } catch (err) {
        console.error('Android audit execution error:', err);
        await db.audit.update({ where: { id: audit.id }, data: { status: 'failed' } });
      }
    })();

    return NextResponse.json({
      audit: { id: audit.id, status: 'running', mode: 'deep', createdAt: audit.createdAt },
    }, { status: 202 });
  } catch (err) {
    console.error('APK upload error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}