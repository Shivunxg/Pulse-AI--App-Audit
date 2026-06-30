import { ImageResponse } from 'next/og';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

function scoreColor(score: number): string {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#d97706';
  return '#dc2626';
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const audit = await db.audit.findFirst({
    where: { publicSlug: slug, isPublic: true } as any,
    include: { project: { select: { name: true, url: true } } },
  });

  if (!audit) {
    return new Response('Not found', { status: 404 });
  }

  const health = Math.round(audit.healthScore || 0);
  const color = scoreColor(health);

  const metrics = [
    { label: 'Performance', value: Math.round(audit.performanceScore || 0) },
    { label: 'SEO', value: Math.round(audit.seoScore || 0) },
    { label: 'Security', value: Math.round(audit.securityScore || 0) },
    { label: 'Accessibility', value: Math.round(audit.accessibilityScore || 0) },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          padding: '60px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff' }} />
          </div>
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#18181b' }}>Pulse AI</span>
        </div>

        <div style={{ display: 'flex', flex: 1, gap: '60px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div
              style={{
                width: '220px',
                height: '220px',
                borderRadius: '50%',
                border: `16px solid ${color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}
            >
              <span style={{ fontSize: '64px', fontWeight: 800, color: '#18181b' }}>{health}</span>
              <span style={{ fontSize: '16px', color: '#71717a' }}>/ 100</span>
            </div>
            <span style={{ fontSize: '18px', color: '#71717a', marginTop: '16px' }}>Health Score</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <span style={{ fontSize: '36px', fontWeight: 700, color: '#18181b', marginBottom: '8px' }}>
              {audit.project.name}
            </span>
            <span style={{ fontSize: '20px', color: '#71717a', marginBottom: '32px' }}>
              {audit.project.url}
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              {metrics.map((m) => (
                <div
                  key={m.label}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#f4f4f5',
                    borderRadius: '12px',
                    padding: '16px 24px',
                    minWidth: '140px',
                  }}
                >
                  <span style={{ fontSize: '28px', fontWeight: 700, color: scoreColor(m.value) }}>{m.value}</span>
                  <span style={{ fontSize: '14px', color: '#71717a' }}>{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '16px', color: '#a1a1aa' }}>
          pulse-ai-app-audit.vercel.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
