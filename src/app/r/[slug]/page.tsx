import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { PublicReportView } from '@/components/pulse/public-report-view';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getAudit(slug: string) {
  const audit = await db.audit.findFirst({
    where: { publicSlug: slug, isPublic: true } as any,
    include: { project: { select: { name: true, url: true, type: true } } },
  });
  return audit;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const audit = await getAudit(slug);

  if (!audit) {
    return { title: 'Report not found — Pulse AI' };
  }

  const score = Math.round(audit.healthScore || 0);
  const grade = score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'Needs Work';
  const title = `${audit.project.name} scored ${score}/100 — Pulse AI Audit`;
  const description = `${grade} product health. Performance: ${Math.round(audit.performanceScore || 0)}, SEO: ${Math.round(audit.seoScore || 0)}, Security: ${Math.round(audit.securityScore || 0)}. Free product intelligence audit by Pulse AI.`;

  const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-ai-app-audit.vercel.app'}/api/og/report/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function PublicReportPage({ params }: PageProps) {
  const { slug } = await params;
  const audit = await getAudit(slug);

  if (!audit) notFound();

  db.audit.update({
    where: { id: audit.id },
    data: { publicViews: { increment: 1 } } as any,
  }).catch(() => {});

  return (
    <PublicReportView
      audit={{
        id: audit.id,
        mode: audit.mode,
        healthScore: audit.healthScore,
        performanceScore: audit.performanceScore,
        seoScore: audit.seoScore,
        accessibilityScore: audit.accessibilityScore,
        securityScore: audit.securityScore,
        uxScore: audit.uxScore,
        technologyScore: (audit as any).technologyScore,
        contentScore: (audit as any).contentScore,
        findings: JSON.parse(audit.findings || '{}'),
        aiSummary: JSON.parse(audit.aiSummary || '{}'),
        responseTime: audit.responseTime,
        pageSize: audit.pageSize,
        createdAt: audit.createdAt.toISOString(),
        project: audit.project,
      }}
    />
  );
}
