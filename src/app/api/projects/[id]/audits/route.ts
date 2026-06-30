import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { runAudit } from '@/lib/audit-engine';
import { generateAiSummary } from '@/lib/ai-summary';

export const maxDuration = 60;

// Call the Railway Playwright worker for deep audits
async function callDeepWorker(url: string) {
  const workerUrl = process.env.PLAYWRIGHT_WORKER_URL;
  if (!workerUrl) throw new Error('PLAYWRIGHT_WORKER_URL is not set. Deploy the Railway worker first.');

  const res = await fetch(`${workerUrl}/audit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.WORKER_SECRET ? { 'x-worker-secret': process.env.WORKER_SECRET } : {}),
    },
    body: JSON.stringify({ url }),
    signal: AbortSignal.timeout(55000), // 55s — just under Vercel's 60s maxDuration
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok || !data.ok) {
    throw new Error(data.error || `Worker returned ${res.status}`);
  }

  return data.result;
}

// Enhanced HTTP deep audit — fallback when worker is not configured
async function runDeepHttpAudit(url: string) {
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
  const base = new URL(normalizedUrl);
  const simple = await runAudit(url);

  const [sitemapRes, robotsRes, wwwRes] = await Promise.allSettled([
    fetch(`${base.origin}/sitemap.xml`, { signal: AbortSignal.timeout(8000) }),
    fetch(`${base.origin}/robots.txt`, { signal: AbortSignal.timeout(8000) }),
    fetch(
      normalizedUrl.includes('://www.') ? normalizedUrl.replace('://www.', '://') : normalizedUrl.replace('://', '://www.'),
      { redirect: 'manual', signal: AbortSignal.timeout(8000) }
    ),
  ]);

  const hasSitemap = sitemapRes.status === 'fulfilled' && sitemapRes.value.ok;
  const hasRobots = robotsRes.status === 'fulfilled' && robotsRes.value.ok;
  const wwwRedirects = wwwRes.status === 'fulfilled' && [301, 302, 308].includes(wwwRes.value.status);

  const seo = simple.findings.seo;
  if (hasSitemap) seo.passed.push({ category: 'seo', severity: 'passed', title: 'XML Sitemap Found', description: 'sitemap.xml detected.' });
  else seo.issues.push({ category: 'seo', severity: 'warning', title: 'No XML Sitemap', description: 'No sitemap.xml found.', recommendation: 'Generate and submit a sitemap to Google Search Console.' });
  if (hasRobots) seo.passed.push({ category: 'seo', severity: 'passed', title: 'robots.txt Present', description: 'robots.txt found.' });
  else seo.issues.push({ category: 'seo', severity: 'warning', title: 'No robots.txt', description: 'No robots.txt found.', recommendation: 'Add a robots.txt to manage crawler access.' });
  if (!wwwRedirects) seo.issues.push({ category: 'seo', severity: 'info', title: 'No WWW Redirect', description: 'No redirect between www/non-www detected.', recommendation: 'Set up a 301 redirect and canonical tags.' });
  else seo.passed.push({ category: 'seo', severity: 'passed', title: 'WWW Redirect Configured', description: 'Redirect between www and non-www is in place.' });

  return simple;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { id } = await params;
    const project = await db.project.findFirst({ where: { id, userId: user.id } });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    if (project.type !== 'website') return NextResponse.json({ error: 'Use APK endpoint for Android projects' }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const mode = body.mode === 'deep' ? 'deep' : 'simple';
    const workerUrl = process.env.PLAYWRIGHT_WORKER_URL;
    console.log(`[audit] mode=${mode} body.mode=${body.mode} workerUrl="${workerUrl}" workerSet=${!!workerUrl}`);

    const audit = await db.audit.create({
      data: { projectId: id, status: 'running', mode },
    });

    try {
      let result;

      if (mode === 'deep') {
        // Try Railway Playwright worker first, fall back to enhanced HTTP
        if (process.env.PLAYWRIGHT_WORKER_URL) {
          try {
            result = await callDeepWorker(project.url);
            console.log(`[audit] Railway worker succeeded — pageSize=${result.pageSize} responseTime=${result.responseTime}`);
          } catch (workerErr) {
            const errMsg = workerErr instanceof Error ? workerErr.message : String(workerErr);
            console.error(`[audit] RAILWAY WORKER FAILED: ${errMsg} — falling back to enhanced HTTP`);
            result = await runDeepHttpAudit(project.url);
          }
        } else {
          console.warn('[audit] PLAYWRIGHT_WORKER_URL not set — using enhanced HTTP fallback');
          result = await runDeepHttpAudit(project.url);
        }
      } else {
        result = await runAudit(project.url);
      }

      let aiSummaryJson = '{}';
      try {
        const aiSummary = await generateAiSummary(result.findings, project.url);
        aiSummaryJson = JSON.stringify(aiSummary);
      } catch (aiErr) {
        console.error('[audit] AI summary error (non-fatal):', aiErr);
      }

      const completed = await db.audit.update({
        where: { id: audit.id },
        data: {
          status: 'completed',
          mode,
          healthScore: result.healthScore,
          performanceScore: result.performanceScore,
          seoScore: result.seoScore,
          accessibilityScore: result.accessibilityScore,
          securityScore: result.securityScore,
          uxScore: result.uxScore,
          technologyScore: (result as any).technologyScore ?? null,
          contentScore: (result as any).contentScore ?? null,
          findings: JSON.stringify(result.findings),
          aiSummary: aiSummaryJson,
          responseTime: result.responseTime,
          pageSize: result.pageSize,
        },
      });

      return NextResponse.json({
        audit: {
          id: completed.id,
          status: completed.status,
          mode: completed.mode,
          healthScore: completed.healthScore,
          createdAt: completed.createdAt,
        },
      });

    } catch (err) {
      console.error('[audit] Execution error:', err);
      await db.audit.update({ where: { id: audit.id }, data: { status: 'failed' } });
      return NextResponse.json({ error: 'Audit failed', detail: String(err) }, { status: 500 });
    }

  } catch (err) {
    console.error('[audit] Route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
