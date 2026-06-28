import ZAI from 'z-ai-web-dev-sdk';
import type { AuditFindings, AiSummary } from '@/types';

export async function generateAiSummary(findings: AuditFindings, url: string): Promise<AiSummary> {
  const zai = await ZAI.create();

  const prompt = `You are a senior product analyst auditing "${url}". Based on the following deterministic audit findings, provide:

1. An executive summary (2-3 sentences)
2. 3-5 key strengths
3. Critical issues that need immediate attention
4. Actionable recommendations (prioritized)
5. Top 3 priority actions the team should take this week

AUDIT RESULTS:

Performance (Score: ${findings.performance.score}/100):
- Response time: ${Math.round(findings.performance.responseTime)}ms
- Page size: ${(findings.performance.pageSize / 1024).toFixed(0)}KB
- Issues: ${findings.performance.issues.map(i => `${i.title}: ${i.description}`).join('; ') || 'None'}

SEO (Score: ${findings.seo.score}/100):
- Title: ${findings.seo.title || 'Missing'}
- Meta description: ${findings.seo.metaDescription || 'Missing'}
- Canonical: ${findings.seo.canonicalUrl || 'Missing'}
- OG tags: ${Object.keys(findings.seo.ogTags).length > 0 ? Object.entries(findings.seo.ogTags).map(([k, v]) => `${k}=${v}`).join(', ') : 'None'}
- Heading structure: ${findings.seo.headingStructure.map(h => `H${h.level}: ${h.text}`).join(', ') || 'None'}
- Issues: ${findings.seo.issues.map(i => `${i.title}: ${i.description}`).join('; ') || 'None'}

Accessibility (Score: ${findings.accessibility.score}/100):
- Images: ${findings.accessibility.totalImages} total, ${findings.accessibility.imagesWithoutAlt} missing alt
- Has lang attribute: ${findings.accessibility.hasLang}
- Missing labels: ${findings.accessibility.missingLabels}
- Issues: ${findings.accessibility.issues.map(i => `${i.title}: ${i.description}`).join('; ') || 'None'}

Security (Score: ${findings.security.score}/100):
- HTTPS: ${findings.security.isHttps}
- Security headers: ${Object.entries(findings.security.headers).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('; ') || 'None configured'}
- Issues: ${findings.security.issues.map(i => `${i.title}: ${i.description}`).join('; ') || 'None'}

UX (Score: ${findings.ux.score}/100):
- Viewport: ${findings.ux.hasViewport}
- Favicon: ${findings.ux.hasFavicon}
- Links: ${findings.ux.linkCount} total, ${findings.ux.externalLinks} external
- Issues: ${findings.ux.issues.map(i => `${i.title}: ${i.description}`).join('; ') || 'None'}

Respond in valid JSON with this exact structure:
{
  "executiveSummary": "...",
  "keyStrengths": ["...", "..."],
  "criticalIssues": ["...", "..."],
  "recommendations": ["...", "..."],
  "priorityActions": ["...", "...", "..."]
}

Be specific, actionable, and concise. Do not include generic advice. Reference specific findings from the audit data.`;

  try {
    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a senior product and engineering analyst. You analyze website audit data and provide specific, actionable insights. Always respond with valid JSON matching the requested structure.' },
        { role: 'user', content: prompt },
      ],
    });

    const content = response?.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        executiveSummary: parsed.executiveSummary || 'Unable to generate summary.',
        keyStrengths: Array.isArray(parsed.keyStrengths) ? parsed.keyStrengths : [],
        criticalIssues: Array.isArray(parsed.criticalIssues) ? parsed.criticalIssues : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        priorityActions: Array.isArray(parsed.priorityActions) ? parsed.priorityActions : [],
      };
    }
  } catch (err) {
    console.error('AI summary generation failed:', err);
  }

  return {
    executiveSummary: 'AI summary is unavailable. Please review the deterministic findings below for detailed analysis.',
    keyStrengths: [],
    criticalIssues: [],
    recommendations: [],
    priorityActions: [],
  };
}