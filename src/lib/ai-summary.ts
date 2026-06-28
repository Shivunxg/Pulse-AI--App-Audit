import ZAI from 'z-ai-web-dev-sdk';
import type { AuditFindings, AiSummary, AndroidFindings } from '@/types';

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
${findings.performance.fcp != null ? `- First Contentful Paint (FCP): ${Math.round(findings.performance.fcp)}ms
` : ''}${findings.performance.lcp != null ? `- Largest Contentful Paint (LCP): ${Math.round(findings.performance.lcp)}ms
` : ''}${findings.performance.cls != null ? `- Cumulative Layout Shift (CLS): ${findings.performance.cls.toFixed(3)}
` : ''}${findings.performance.domNodes != null ? `- DOM nodes: ${findings.performance.domNodes}
` : ''}${findings.performance.consoleErrors > 0 ? `- Console errors: ${findings.performance.consoleErrors}
` : ''}- Issues: ${findings.performance.issues.map(i => `${i.title}: ${i.description}`).join('; ') || 'None'}

SEO (Score: ${findings.seo.score}/100):
- Title: ${findings.seo.title || 'Missing'}
- Meta description: ${findings.seo.metaDescription || 'Missing'}
- Canonical: ${findings.seo.canonicalUrl || 'Missing'}
- OG tags: ${Object.keys(findings.seo.ogTags).length > 0 ? Object.entries(findings.seo.ogTags).map(([k, v]) => `${k}=${v}`).join(', ') : 'None'}
- Heading structure: ${findings.seo.headingStructure.map(h => `H${h.level}: ${h.text}`).join(', ') || 'None'}
${findings.seo.hasRobotsTxt != null ? `- robots.txt: ${findings.seo.hasRobotsTxt ? 'Found' : 'Missing'}
` : ''}${findings.seo.hasSitemap != null ? `- sitemap.xml: ${findings.seo.hasSitemap ? 'Found' : 'Missing'}
` : ''}${findings.seo.brokenLinks != null && findings.seo.brokenLinks > 0 ? `- Broken links: ${findings.seo.brokenLinks}
` : ''}- Issues: ${findings.seo.issues.map(i => `${i.title}: ${i.description}`).join('; ') || 'None'}

Accessibility (Score: ${findings.accessibility.score}/100):
- Images: ${findings.accessibility.totalImages} total, ${findings.accessibility.imagesWithoutAlt} missing alt
- Has lang attribute: ${findings.accessibility.hasLang}
- Missing labels: ${findings.accessibility.missingLabels}
- Issues: ${findings.accessibility.issues.map(i => `${i.title}: ${i.description}`).join('; ') || 'None'}

Security (Score: ${findings.security.score}/100):
- HTTPS: ${findings.security.isHttps}
- Security headers: ${Object.entries(findings.security.headers).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('; ') || 'None configured'}
${findings.security.mixedContentCount != null && findings.security.mixedContentCount > 0 ? `- Mixed content resources: ${findings.security.mixedContentCount}
` : ''}${findings.security.vulnerableLibraries && findings.security.vulnerableLibraries.length > 0 ? `- Vulnerable libraries: ${findings.security.vulnerableLibraries.join(', ')}
` : ''}- Issues: ${findings.security.issues.map(i => `${i.title}: ${i.description}`).join('; ') || 'None'}

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

export async function generateAndroidAiSummary(findings: AndroidFindings, appName: string): Promise<AiSummary> {
  const zai = await ZAI.create();

  const prompt = `You are a senior Android security and quality analyst auditing "${appName}". Based on the following deterministic findings, provide:

1. An executive summary (2-3 sentences)
2. 3-5 key strengths
3. Critical issues that need immediate attention
4. Actionable recommendations (prioritized)
5. Top 3 priority actions the team should take this week

AUDIT RESULTS:

Security (Score: ${findings.security.score}/100):
- Total permissions: ${findings.security.totalPermissions}
- Dangerous permissions: ${findings.security.dangerousPermissions.join(', ') || 'None'}
- Debuggable: ${findings.security.isDebuggable}
- Cleartext traffic: ${findings.security.usesCleartextTraffic}
- Exported components: ${findings.security.exportedComponents}
- Network security config: ${findings.security.networkSecurityConfig}
- Hardcoded secrets: ${findings.security.hardcodedSecrets.length} found
- Issues: ${findings.security.issues.map(i => `${i.title}: ${i.description}`).join('; ') || 'None'}

Configuration (Score: ${findings.configuration.score}/100):
- Package: ${findings.configuration.packageName}
- Version: ${findings.configuration.versionName || 'Unknown'}
- Min SDK: ${findings.configuration.minSdkVersion || 'Unknown'}
- Target SDK: ${findings.configuration.targetSdkVersion || 'Unknown'}
- Architectures: ${findings.configuration.supportedArchitectures.join(', ') || 'Unknown'}
- Issues: ${findings.configuration.issues.map(i => `${i.title}: ${i.description}`).join('; ') || 'None'}

Privacy (Score: ${findings.privacy.score}/100):
- Trackers: ${findings.privacy.trackersFound.join(', ') || 'None'}
- Analytics: ${findings.privacy.analyticsSdks.join(', ') || 'None'}
- Ad SDKs: ${findings.privacy.adSdks.join(', ') || 'None'}
- Dangerous receivers: ${findings.privacy.dangerousReceivers.join(', ') || 'None'}
- Issues: ${findings.privacy.issues.map(i => `${i.title}: ${i.description}`).join('; ') || 'None'}

Code Quality (Score: ${findings.codeQuality.score}/100):
- ProGuard: ${findings.codeQuality.hasProguard}
- Total DEX size: ${(findings.codeQuality.totalDexSize / 1024 / 1024).toFixed(1)}MB
- Native libraries: ${findings.codeQuality.nativeLibraries.length}
- Third-party libraries: ${findings.codeQuality.thirdPartyLibraries.length}
- Deprecated APIs: ${findings.codeQuality.deprecatedApis.join(', ') || 'None'}
- Issues: ${findings.codeQuality.issues.map(i => `${i.title}: ${i.description}`).join('; ') || 'None'}

Performance (Score: ${findings.performance.score}/100):
- APK size: ${(findings.performance.apkSizeBytes / 1024 / 1024).toFixed(1)}MB
- Total files: ${findings.performance.totalFiles}
- Resources: ${findings.performance.resourceCount}, Assets: ${findings.performance.assetCount}
- Large assets: ${findings.performance.largeAssets.join(', ') || 'None'}
- Issues: ${findings.performance.issues.map(i => `${i.title}: ${i.description}`).join('; ') || 'None'}

Respond in valid JSON with this exact structure:
{
  "executiveSummary": "...",
  "keyStrengths": ["...", "..."],
  "criticalIssues": ["...", "..."],
  "recommendations": ["...", "..."],
  "priorityActions": ["...", "...", "..."]
}

Be specific, actionable, and concise. Reference specific findings.`;

  try {
    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a senior Android security and quality analyst. Always respond with valid JSON.' },
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
    console.error('Android AI summary error:', err);
  }

  return {
    executiveSummary: 'AI summary is unavailable. Review the deterministic findings below.',
    keyStrengths: [], criticalIssues: [], recommendations: [], priorityActions: [],
  };
}