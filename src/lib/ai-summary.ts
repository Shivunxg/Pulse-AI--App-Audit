import type { AuditFindings, AiSummary, AndroidFindings } from '@/types';

async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = await res.json();
  return data?.content?.[0]?.text || '';
}

function parseAiResponse(content: string): AiSummary {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        executiveSummary: parsed.executiveSummary || '',
        keyStrengths: Array.isArray(parsed.keyStrengths) ? parsed.keyStrengths : [],
        criticalIssues: Array.isArray(parsed.criticalIssues) ? parsed.criticalIssues : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        priorityActions: Array.isArray(parsed.priorityActions) ? parsed.priorityActions : [],
      };
    } catch {}
  }
  return { executiveSummary: '', keyStrengths: [], criticalIssues: [], recommendations: [], priorityActions: [] };
}

const FALLBACK: AiSummary = {
  executiveSummary: 'AI summary unavailable. Review the findings below for a detailed analysis.',
  keyStrengths: [], criticalIssues: [], recommendations: [], priorityActions: [],
};

export async function generateAiSummary(findings: AuditFindings, url: string): Promise<AiSummary> {
  const prompt = `You are a senior product analyst auditing "${url}". Based on the following deterministic audit findings, provide a concise analysis.

AUDIT RESULTS:

Performance (Score: ${findings.performance.score}/100):
- Response time: ${Math.round(findings.performance.responseTime || 0)}ms
- Page size: ${((findings.performance.pageSize || 0) / 1024).toFixed(0)}KB
${findings.performance.fcp != null ? `- FCP: ${Math.round(findings.performance.fcp)}ms\n` : ''}${findings.performance.lcp != null ? `- LCP: ${Math.round(findings.performance.lcp)}ms\n` : ''}${findings.performance.cls != null ? `- CLS: ${findings.performance.cls.toFixed(3)}\n` : ''}${findings.performance.domNodes != null ? `- DOM nodes: ${findings.performance.domNodes}\n` : ''}${(findings.performance.consoleErrors || 0) > 0 ? `- Console errors: ${findings.performance.consoleErrors}\n` : ''}- Issues: ${findings.performance.issues.map((i: any) => `${i.title}`).join('; ') || 'None'}

SEO (Score: ${findings.seo.score}/100):
- Title: ${(findings.seo as any).title || 'Missing'}
- Meta description: ${(findings.seo as any).metaDescription || 'Missing'}
${(findings.seo as any).hasRobotsTxt != null ? `- robots.txt: ${(findings.seo as any).hasRobotsTxt ? 'Found' : 'Missing'}\n` : ''}${(findings.seo as any).hasSitemap != null ? `- sitemap.xml: ${(findings.seo as any).hasSitemap ? 'Found' : 'Missing'}\n` : ''}- Issues: ${findings.seo.issues.map((i: any) => i.title).join('; ') || 'None'}

Accessibility (Score: ${findings.accessibility.score}/100):
- Issues: ${findings.accessibility.issues.map((i: any) => i.title).join('; ') || 'None'}
- Passed: ${findings.accessibility.passed.length} checks

Security (Score: ${findings.security.score}/100):
- Issues: ${findings.security.issues.map((i: any) => i.title).join('; ') || 'None'}
- Passed: ${findings.security.passed.length} checks

UX (Score: ${findings.ux.score}/100):
- Issues: ${findings.ux.issues.map((i: any) => i.title).join('; ') || 'None'}
- Passed: ${findings.ux.passed.length} checks

Respond ONLY with valid JSON — no markdown, no backticks:
{
  "executiveSummary": "2-3 sentence summary referencing specific scores",
  "keyStrengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "criticalIssues": ["critical issue 1", "critical issue 2"],
  "recommendations": ["specific fix 1", "specific fix 2", "specific fix 3"],
  "priorityActions": ["action this week 1", "action this week 2", "action this week 3"]
}`;

  try {
    const content = await callClaude(
      'You are a senior product and engineering analyst. Analyze website audit data and provide specific, actionable insights. Always respond with valid JSON only — no markdown fences.',
      prompt
    );
    return parseAiResponse(content);
  } catch (err) {
    console.error('AI summary error:', err);
    return FALLBACK;
  }
}

export async function generateAndroidAiSummary(findings: AndroidFindings, appName: string): Promise<AiSummary> {
  const prompt = `You are a senior Android security analyst auditing "${appName}".

AUDIT RESULTS:
Security (Score: ${findings.security.score}/100):
- Dangerous permissions: ${findings.security.dangerousPermissions.join(', ') || 'None'}
- Debuggable: ${findings.security.isDebuggable}
- Cleartext traffic: ${findings.security.usesCleartextTraffic}
- Issues: ${findings.security.issues.map((i: any) => i.title).join('; ') || 'None'}

Configuration (Score: ${findings.configuration.score}/100):
- Package: ${findings.configuration.packageName}
- Min SDK: ${findings.configuration.minSdkVersion || 'Unknown'} / Target SDK: ${findings.configuration.targetSdkVersion || 'Unknown'}
- Issues: ${findings.configuration.issues.map((i: any) => i.title).join('; ') || 'None'}

Privacy (Score: ${findings.privacy.score}/100):
- Analytics SDKs: ${findings.privacy.analyticsSdks.join(', ') || 'None'}
- Ad SDKs: ${findings.privacy.adSdks.join(', ') || 'None'}
- Issues: ${findings.privacy.issues.map((i: any) => i.title).join('; ') || 'None'}

Code Quality (Score: ${findings.codeQuality.score}/100):
- ProGuard: ${findings.codeQuality.hasProguard}
- Issues: ${findings.codeQuality.issues.map((i: any) => i.title).join('; ') || 'None'}

Respond ONLY with valid JSON:
{
  "executiveSummary": "2-3 sentence summary",
  "keyStrengths": ["strength 1", "strength 2"],
  "criticalIssues": ["issue 1", "issue 2"],
  "recommendations": ["fix 1", "fix 2", "fix 3"],
  "priorityActions": ["action 1", "action 2", "action 3"]
}`;

  try {
    const content = await callClaude(
      'You are a senior Android security and quality analyst. Always respond with valid JSON only.',
      prompt
    );
    return parseAiResponse(content);
  } catch (err) {
    console.error('Android AI summary error:', err);
    return FALLBACK;
  }
}
