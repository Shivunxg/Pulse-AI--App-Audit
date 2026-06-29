import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { runAudit } from '@/lib/audit-engine';
import { generateAiSummary } from '@/lib/ai-summary';

export const maxDuration = 60;

// Enhanced deep audit using multiple HTTP checks (no Playwright — not available on Vercel)
async function runDeepHttpAudit(url: string) {
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
  const base = new URL(normalizedUrl);

  // Run the base simple audit first
  const simple = await runAudit(url);

  // Additional checks: sitemap, robots.txt, www redirect, multiple pages
  const extraChecks = await Promise.allSettled([
    fetch(`${base.origin}/sitemap.xml`, { signal: AbortSignal.timeout(8000) }),
    fetch(`${base.origin}/robots.txt`, { signal: AbortSignal.timeout(8000) }),
    fetch(`${base.origin}/sitemap_index.xml`, { signal: AbortSignal.timeout(8000) }),
    // Check if www redirects to non-www or vice versa
    fetch(normalizedUrl.includes('://www.') ? normalizedUrl.replace('://www.', '://') : normalizedUrl.replace('://', '://www.'), {
      redirect: 'manual', signal: AbortSignal.timeout(8000)
    }),
  ]);

  const hasSitemap = (extraChecks[0].status === 'fulfilled' && extraChecks[0].value.ok) ||
                     (extraChecks[2].status === 'fulfilled' && extraChecks[2].value.ok);
  const hasRobots = extraChecks[1].status === 'fulfilled' && extraChecks[1].value.ok;
  const wwwRedirects = extraChecks[3].status === 'fulfilled' &&
                       [301, 302, 308].includes(extraChecks[3].value.status);

  // Inject extra findings into SEO category
  const seoFindings = simple.findings.seo;
  if (hasSitemap) {
    seoFindings.passed.push({ category: 'seo', severity: 'passed', title: 'XML Sitemap Found', description: 'A sitemap.xml was found, helping search engines discover your pages.' });
  } else {
    seoFindings.issues.push({ category: 'seo', severity: 'warning', title: 'No XML Sitemap', description: 'No sitemap.xml found. This makes it harder for search engines to crawl all your pages.', recommendation: 'Generate and submit a sitemap.xml to Google Search Console.' });
  }
  if (hasRobots) {
    seoFindings.passed.push({ category: 'seo', severity: 'passed', title: 'robots.txt Present', description: 'A robots.txt file was found, allowing you to control crawler access.' });
  } else {
    seoFindings.issues.push({ category: 'seo', severity: 'warning', title: 'No robots.txt', description: 'No robots.txt found. Without it, all crawlers have unrestricted access.', recommendation: 'Add a robots.txt file to manage crawler behavior.' });
  }
  if (!wwwRedirects) {
    seoFindings.issues.push({ category: 'seo', severity: 'info', title: 'WWW/Non-WWW Redirect', description: 'No canonical redirect detected between www and non-www versions. Both may be indexed separately.', recommendation: 'Set up a 301 redirect from one version to the other and use canonical tags.' });
  } else {
    seoFindings.passed.push({ category: 'seo', severity: 'passed', title: 'WWW Redirect Configured', description: 'A redirect exists between www and non-www, preventing duplicate content.' });
  }

  // Recalculate SEO score with new findings
  const seoIssueCount = seoFindings.issues.filter(f => f.severity === 'critical').length * 20 +
                        seoFindings.issues.filter(f => f.severity === 'warning').length * 8;
  seoFindings.score = Math.max(0, Math.min(100, seoFindings.score - seoIssueCount * 0.3 + (hasSitemap ? 5 : 0) + (hasRobots ? 5 : 0)));

  // Attach extra metadata to findings for display
  (simple.findings as any).hasSitemap = hasSitemap;
  (simple.findings as any).hasRobotsTxt = hasRobots;

  // Recalculate overall health score
  const newSeoWeight = seoFindings.score * 0.2;
  const healthAdjustment = (simple.seoScore - seoFindings.score) * 0.2;
  simple.seoScore = Math.round(seoFindings.score);
  simple.healthScore = Math.max(0, Math.min(100, simple.healthScore - healthAdjustment));

  return simple;
}

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

    if (project.type !== 'website') {
      return NextResponse.json({ error: 'Use the APK upload endpoint for Android projects' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const mode = body.mode === 'deep' ? 'deep' : 'simple';

    const audit = await db.audit.create({
      data: { projectId: id, status: 'running', mode },
    });

    try {
      // Deep mode: enhanced HTTP audit with sitemap/robots/redirect checks
      // (Playwright not available on Vercel serverless — uses enhanced HTTP instead)
      const result = mode === 'deep'
        ? await runDeepHttpAudit(project.url)
        : await runAudit(project.url);

      let aiSummaryJson = '{}';
      try {
        const aiSummary = await generateAiSummary(result.findings, project.url);
        aiSummaryJson = JSON.stringify(aiSummary);
      } catch (aiErr) {
        console.error('AI summary error (non-fatal):', aiErr);
      }

      const completed = await db.audit.update({
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

      return NextResponse.json({
        audit: {
          id: completed.id,
          status: completed.status,
          mode: completed.mode,
          healthScore: completed.healthScore,
          createdAt: completed.createdAt,
        },
      }, { status: 200 });

    } catch (err) {
      console.error('Audit execution error:', err);
      await db.audit.update({ where: { id: audit.id }, data: { status: 'failed' } });
      return NextResponse.json({ error: 'Audit failed', detail: String(err) }, { status: 500 });
    }

  } catch (err) {
    console.error('Audit trigger error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}