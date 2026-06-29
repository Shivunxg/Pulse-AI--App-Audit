import { chromium, Browser, Page } from 'playwright';

interface Finding {
  category: string;
  severity: 'critical' | 'warning' | 'info' | 'passed';
  title: string;
  description: string;
  recommendation?: string;
}

interface CategoryResult {
  score: number;
  issues: Finding[];
  passed: Finding[];
}

interface DeepAuditResult {
  healthScore: number;
  performanceScore: number;
  seoScore: number;
  accessibilityScore: number;
  securityScore: number;
  uxScore: number;
  responseTime: number;
  pageSize: number;
  findings: {
    performance: CategoryResult & {
      fcp?: number;
      lcp?: number;
      cls?: number;
      tti?: number;
      domNodes?: number;
      consoleErrors?: number;
      networkRequests?: number;
    };
    seo: CategoryResult & {
      headingStructure?: { level: number; text: string }[];
      hasSitemap?: boolean;
      hasRobotsTxt?: boolean;
      brokenLinks?: number;
    };
    accessibility: CategoryResult;
    security: CategoryResult & {
      headers?: Record<string, string | null>;
    };
    ux: CategoryResult & {
      mobileScore?: number;
      hasScrollIssues?: boolean;
    };
  };
  screenshot?: string; // base64
}

function finding(
  category: string,
  severity: 'critical' | 'warning' | 'info' | 'passed',
  title: string,
  description: string,
  recommendation?: string
): Finding {
  return { category, severity, title, description, recommendation };
}

function scoreFromIssues(issues: Finding[], passed: Finding[]): number {
  const total = issues.length + passed.length;
  if (total === 0) return 100;
  const criticals = issues.filter(f => f.severity === 'critical').length;
  const warnings = issues.filter(f => f.severity === 'warning').length;
  const deduction = (criticals * 20) + (warnings * 8);
  return Math.max(0, Math.min(100, 100 - deduction));
}

async function auditPerformance(page: Page, responseTime: number, pageSize: number, html: string) {
  const issues: Finding[] = [];
  const passed: Finding[] = [];

  // Core Web Vitals via PerformanceObserver
  const vitals = await page.evaluate(() => {
    return new Promise<{ fcp: number; lcp: number; cls: number; tti: number; domNodes: number }>((resolve) => {
      let fcp = 0, lcp = 0, cls = 0;
      const domNodes = document.querySelectorAll('*').length;

      // FCP
      const fcpObs = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) fcp = entries[entries.length - 1].startTime;
      });
      try { fcpObs.observe({ entryTypes: ['paint'] }); } catch {}

      // LCP
      const lcpObs = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) lcp = entries[entries.length - 1].startTime;
      });
      try { lcpObs.observe({ entryTypes: ['largest-contentful-paint'] }); } catch {}

      // CLS
      const clsObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) cls += (entry as any).value;
        }
      });
      try { clsObs.observe({ entryTypes: ['layout-shift'] }); } catch {}

      // TTI approximation via navigation timing
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const tti = nav ? nav.domInteractive : 0;

      setTimeout(() => resolve({ fcp: Math.round(fcp), lcp: Math.round(lcp), cls: Math.round(cls * 1000) / 1000, tti: Math.round(tti), domNodes }), 2000);
    });
  }).catch(() => ({ fcp: 0, lcp: 0, cls: 0, tti: 0, domNodes: 0 }));

  // Console errors
  const consoleErrors = (page as any).__consoleErrors || 0;

  // Network requests
  const networkRequests = (page as any).__networkRequests || 0;

  // FCP scoring
  if (vitals.fcp > 0) {
    if (vitals.fcp > 3000) issues.push(finding('performance', 'critical', 'Poor First Contentful Paint', `FCP is ${vitals.fcp}ms. Users see a blank page for ${(vitals.fcp / 1000).toFixed(1)}s.`, 'Reduce server response time, eliminate render-blocking resources, inline critical CSS.'));
    else if (vitals.fcp > 1800) issues.push(finding('performance', 'warning', 'Needs Improvement: FCP', `FCP is ${vitals.fcp}ms. Target is under 1.8s.`, 'Optimize critical rendering path — defer non-critical JS, preload key resources.'));
    else passed.push(finding('performance', 'passed', 'Good First Contentful Paint', `FCP is ${vitals.fcp}ms, within the good range (<1.8s).`));
  }

  // LCP scoring
  if (vitals.lcp > 0) {
    if (vitals.lcp > 4000) issues.push(finding('performance', 'critical', 'Poor Largest Contentful Paint', `LCP is ${vitals.lcp}ms. This is a Core Web Vital that directly impacts Google ranking.`, 'Optimize hero images, preload LCP element, reduce server response time.'));
    else if (vitals.lcp > 2500) issues.push(finding('performance', 'warning', 'Needs Improvement: LCP', `LCP is ${vitals.lcp}ms. Target is under 2.5s for good user experience.`, 'Use next-gen image formats (WebP/AVIF), add loading="eager" to hero images.'));
    else passed.push(finding('performance', 'passed', 'Good Largest Contentful Paint', `LCP is ${vitals.lcp}ms, within the good range (<2.5s).`));
  }

  // CLS scoring
  if (vitals.cls > 0.25) issues.push(finding('performance', 'critical', 'High Cumulative Layout Shift', `CLS score is ${vitals.cls}. Elements are shifting significantly after load, harming UX.`, 'Set explicit width/height on images and videos, avoid inserting content above existing content.'));
  else if (vitals.cls > 0.1) issues.push(finding('performance', 'warning', 'Moderate Layout Shift', `CLS score is ${vitals.cls}. Some layout instability detected.`, 'Reserve space for dynamic content like ads and embeds.'));
  else if (vitals.cls >= 0) passed.push(finding('performance', 'passed', 'Stable Layout', `CLS score is ${vitals.cls}, minimal layout shift detected.`));

  // Response time
  if (responseTime > 3000) issues.push(finding('performance', 'critical', 'Slow Server Response (TTFB)', `Response time is ${Math.round(responseTime)}ms. Target is under 800ms.`, 'Implement server-side caching, use a CDN, optimize database queries.'));
  else if (responseTime > 1500) issues.push(finding('performance', 'warning', 'Moderate Server Response', `Response time is ${Math.round(responseTime)}ms. Aim for under 1.5s.`, 'Consider CDN caching or server optimization.'));
  else passed.push(finding('performance', 'passed', 'Fast Server Response', `Response time is ${Math.round(responseTime)}ms.`));

  // DOM complexity
  if (vitals.domNodes > 1500) issues.push(finding('performance', 'warning', 'Excessive DOM Size', `${vitals.domNodes} DOM nodes detected. Large DOMs slow down rendering and interaction.`, 'Break large pages into components, use virtualization for long lists, lazy-load off-screen content.'));
  else passed.push(finding('performance', 'passed', 'Reasonable DOM Size', `${vitals.domNodes} DOM nodes — within acceptable range.`));

  // Console errors
  if (consoleErrors > 5) issues.push(finding('performance', 'warning', 'JavaScript Errors Detected', `${consoleErrors} console errors detected during page load.`, 'Fix JavaScript errors — they may be blocking functionality for users.'));
  else if (consoleErrors === 0) passed.push(finding('performance', 'passed', 'No Console Errors', 'Page loaded without JavaScript errors.'));

  // Page size
  if (pageSize > 5000000) issues.push(finding('performance', 'warning', 'Very Large Page Size', `Total page size is ${(pageSize / 1024 / 1024).toFixed(1)}MB.`, 'Compress images (use WebP), minify CSS/JS, enable gzip/brotli.'));
  else if (pageSize < 500000) passed.push(finding('performance', 'passed', 'Well-Optimised Page Size', `Total page size is ${(pageSize / 1024).toFixed(0)}KB.`));

  const score = scoreFromIssues(issues, passed);
  return { score, issues, passed, fcp: vitals.fcp, lcp: vitals.lcp, cls: vitals.cls, tti: vitals.tti, domNodes: vitals.domNodes, consoleErrors, networkRequests };
}

async function auditSEO(page: Page, html: string, url: string) {
  const issues: Finding[] = [];
  const passed: Finding[] = [];

  const seoData = await page.evaluate(() => {
    const title = document.title;
    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
    const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
    const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
    const twitterCard = document.querySelector('meta[name="twitter:card"]')?.getAttribute('content') || '';
    const viewport = document.querySelector('meta[name="viewport"]')?.getAttribute('content') || '';
    const lang = document.documentElement.lang || '';
    const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.textContent?.trim() || '');
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => ({
      level: parseInt(h.tagName[1]),
      text: (h.textContent?.trim() || '').slice(0, 80),
    }));
    const imgsWithoutAlt = document.querySelectorAll('img:not([alt])').length;
    const totalImgs = document.querySelectorAll('img').length;
    const links = Array.from(document.querySelectorAll('a[href]')).map(a => (a as HTMLAnchorElement).href);
    const structuredData = !!document.querySelector('script[type="application/ld+json"]');
    return { title, metaDesc, canonical, ogTitle, ogDesc, ogImage, twitterCard, viewport, lang, h1s, headings, imgsWithoutAlt, totalImgs, links, structuredData };
  });

  // Title
  if (!seoData.title) issues.push(finding('seo', 'critical', 'Missing Page Title', 'No <title> tag found. This is the single most important on-page SEO element.', 'Add a unique, descriptive title (50-60 characters) to every page.'));
  else if (seoData.title.length < 30) issues.push(finding('seo', 'warning', 'Title Too Short', `Title is "${seoData.title}" (${seoData.title.length} chars). Aim for 50-60 characters.`, 'Expand the title to include primary keyword and brand name.'));
  else if (seoData.title.length > 60) issues.push(finding('seo', 'warning', 'Title Too Long', `Title is ${seoData.title.length} characters. Google truncates after ~60 characters.`, 'Shorten title to 50-60 characters, keeping the keyword near the front.'));
  else passed.push(finding('seo', 'passed', 'Good Page Title', `Title: "${seoData.title}" (${seoData.title.length} chars).`));

  // Meta description
  if (!seoData.metaDesc) issues.push(finding('seo', 'critical', 'Missing Meta Description', 'No meta description found. Google may auto-generate one, often with poor results.', 'Write a compelling meta description (150-160 characters) for every page.'));
  else if (seoData.metaDesc.length < 70) issues.push(finding('seo', 'warning', 'Meta Description Too Short', `Meta description is ${seoData.metaDesc.length} characters. Use 150-160 for best results.`, 'Expand the meta description with a value proposition and CTA.'));
  else if (seoData.metaDesc.length > 160) issues.push(finding('seo', 'warning', 'Meta Description Too Long', `Meta description is ${seoData.metaDesc.length} characters. Google truncates at ~160.`, 'Trim the meta description to 150-160 characters.'));
  else passed.push(finding('seo', 'passed', 'Good Meta Description', `Meta description is ${seoData.metaDesc.length} characters.`));

  // H1
  if (seoData.h1s.length === 0) issues.push(finding('seo', 'critical', 'Missing H1 Tag', 'No H1 heading found. H1 is the primary signal for page topic.', 'Add a single H1 tag containing your primary keyword.'));
  else if (seoData.h1s.length > 1) issues.push(finding('seo', 'warning', 'Multiple H1 Tags', `Found ${seoData.h1s.length} H1 tags. Each page should have exactly one.`, 'Keep only one H1 and use H2/H3 for sub-sections.'));
  else passed.push(finding('seo', 'passed', 'Single H1 Tag', `H1: "${seoData.h1s[0]}".`));

  // Canonical
  if (!seoData.canonical) issues.push(finding('seo', 'warning', 'No Canonical Tag', 'Missing canonical link. Without it, Google may index duplicate URLs.', 'Add <link rel="canonical" href="https://yourdomain.com/page"> to every page.'));
  else passed.push(finding('seo', 'passed', 'Canonical Tag Present', `Canonical: ${seoData.canonical}`));

  // OG tags
  if (!seoData.ogTitle || !seoData.ogImage) issues.push(finding('seo', 'warning', 'Incomplete Open Graph Tags', 'Missing og:title or og:image. Social shares will look unprofessional.', 'Add og:title, og:description, og:image (min 1200×630px), and og:url.'));
  else passed.push(finding('seo', 'passed', 'Open Graph Tags Present', 'og:title and og:image found — social shares will preview correctly.'));

  // Twitter card
  if (!seoData.twitterCard) issues.push(finding('seo', 'info', 'No Twitter Card', 'Missing twitter:card meta tag. Twitter shares may not show rich previews.', 'Add <meta name="twitter:card" content="summary_large_image">.'));
  else passed.push(finding('seo', 'passed', 'Twitter Card Present', `Twitter card type: ${seoData.twitterCard}`));

  // Lang
  if (!seoData.lang) issues.push(finding('seo', 'warning', 'Missing Language Attribute', 'No lang attribute on <html>. Required for accessibility and regional SEO.', 'Add lang="en" (or your language code) to the <html> tag.'));
  else passed.push(finding('seo', 'passed', 'Language Declared', `lang="${seoData.lang}" set on <html>.`));

  // Structured data
  if (!seoData.structuredData) issues.push(finding('seo', 'info', 'No Structured Data', 'No JSON-LD schema found. Structured data enables rich results in Google Search.', 'Add Organization, WebSite, or relevant schema.org markup using JSON-LD.'));
  else passed.push(finding('seo', 'passed', 'Structured Data Found', 'JSON-LD schema markup detected.'));

  // Images without alt
  if (seoData.imgsWithoutAlt > 0) issues.push(finding('seo', 'warning', `${seoData.imgsWithoutAlt} Images Missing Alt Text`, `${seoData.imgsWithoutAlt} of ${seoData.totalImgs} images have no alt attribute.`, 'Add descriptive alt text to all images for SEO and accessibility.'));
  else if (seoData.totalImgs > 0) passed.push(finding('seo', 'passed', 'All Images Have Alt Text', `All ${seoData.totalImgs} images have alt attributes.`));

  // Sitemap + robots
  const base = new URL(url);
  const [sitemapRes, robotsRes] = await Promise.allSettled([
    fetch(`${base.origin}/sitemap.xml`, { signal: AbortSignal.timeout(8000) }),
    fetch(`${base.origin}/robots.txt`, { signal: AbortSignal.timeout(8000) }),
  ]);
  const hasSitemap = sitemapRes.status === 'fulfilled' && sitemapRes.value.ok;
  const hasRobotsTxt = robotsRes.status === 'fulfilled' && robotsRes.value.ok;

  if (hasSitemap) passed.push(finding('seo', 'passed', 'XML Sitemap Found', 'sitemap.xml detected — helps search engines discover all pages.'));
  else issues.push(finding('seo', 'warning', 'No XML Sitemap', 'No sitemap.xml found.', 'Generate a sitemap and submit it to Google Search Console.'));

  if (hasRobotsTxt) passed.push(finding('seo', 'passed', 'robots.txt Present', 'robots.txt found — crawler access is controlled.'));
  else issues.push(finding('seo', 'warning', 'No robots.txt', 'No robots.txt found.', 'Add a robots.txt file to manage crawler access.'));

  // Broken links (sample first 20 internal links)
  const internalLinks = seoData.links.filter((l: string) => {
    try { return new URL(l).origin === base.origin; } catch { return false; }
  }).slice(0, 20);

  let brokenLinks = 0;
  if (internalLinks.length > 0) {
    const linkChecks = await Promise.allSettled(
      internalLinks.map(l => fetch(l, { method: 'HEAD', signal: AbortSignal.timeout(5000) }))
    );
    brokenLinks = linkChecks.filter(r => r.status === 'fulfilled' && r.value.status >= 400).length;
    if (brokenLinks > 0) issues.push(finding('seo', 'warning', `${brokenLinks} Broken Internal Links`, `Found ${brokenLinks} links returning 4xx/5xx errors (checked ${internalLinks.length} links).`, 'Fix or remove broken links — they harm SEO and user experience.'));
    else passed.push(finding('seo', 'passed', 'No Broken Links Detected', `All ${internalLinks.length} sampled internal links are working.`));
  }

  const score = scoreFromIssues(issues, passed);
  return { score, issues, passed, headingStructure: seoData.headings, hasSitemap, hasRobotsTxt, brokenLinks };
}

async function auditAccessibility(page: Page) {
  const issues: Finding[] = [];
  const passed: Finding[] = [];

  // Priority 1: Run axe-core for real WCAG 2.2 AA compliance
  try {
    const { AxeBuilder } = await import('@axe-core/playwright');
    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
      .analyze();

    // Map axe violations to findings
    for (const violation of axeResults.violations) {
      const severity = violation.impact === 'critical' ? 'critical'
        : violation.impact === 'serious' ? 'critical'
        : violation.impact === 'moderate' ? 'warning'
        : 'info';

      const nodeCount = violation.nodes.length;
      const nodeDesc = nodeCount === 1 ? '1 element' : `${nodeCount} elements`;
      const wcagTags = violation.tags.filter(t => t.startsWith('wcag')).slice(0, 2).join(', ');

      issues.push(finding(
        'accessibility',
        severity as any,
        violation.help,
        `${violation.description} Affects ${nodeDesc}.${wcagTags ? ` [${wcagTags}]` : ''}`,
        `${violation.helpUrl ? `Details: ${violation.helpUrl}` : violation.help}`
      ));
    }

    // Map incomplete (needs review) as info
    for (const incomplete of axeResults.incomplete.slice(0, 5)) {
      issues.push(finding(
        'accessibility',
        'info',
        `Needs Review: ${incomplete.help}`,
        `${incomplete.description} — manual verification required.`,
        incomplete.helpUrl || incomplete.help
      ));
    }

    // Map passed rules
    const significantPassed = axeResults.passes.filter(p =>
      ['image-alt', 'label', 'html-has-lang', 'landmark-one-main', 'bypass',
       'color-contrast', 'button-name', 'link-name', 'frame-title'].includes(p.id)
    );
    for (const pass of significantPassed) {
      passed.push(finding('accessibility', 'passed', pass.help, pass.description));
    }

    if (axeResults.violations.length === 0) {
      passed.push(finding('accessibility', 'passed', 'No WCAG Violations Detected',
        `axe-core scanned ${axeResults.passes.length} rules — no violations found.`));
    }

  } catch (axeErr) {
    console.warn('[accessibility] axe-core failed, falling back to manual checks:', axeErr);

    // Fallback: manual DOM checks
    const a11y = await page.evaluate(() => {
      const imgsNoAlt = document.querySelectorAll('img:not([alt])').length;
      const inputsNoLabel = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])')).filter(input => {
        const id = input.getAttribute('id');
        return !id || !document.querySelector(`label[for="${id}"]`);
      }).length;
      const lang = document.documentElement.lang;
      const hasSkipLink = !!document.querySelector('a[href="#main"], a[href="#content"], [class*="skip"]');
      const buttons = Array.from(document.querySelectorAll('button')).filter(b => !b.textContent?.trim() && !b.getAttribute('aria-label')).length;
      const iframes = Array.from(document.querySelectorAll('iframe')).filter(f => !f.getAttribute('title')).length;
      const ariaLandmarks = document.querySelectorAll('main, nav, header, footer, aside, [role="main"], [role="navigation"], [role="banner"]').length;
      return { imgsNoAlt, inputsNoLabel, lang, hasSkipLink, buttons, iframes, ariaLandmarks };
    });

    if (!a11y.lang) issues.push(finding('accessibility', 'critical', 'Missing Language Attribute', 'Screen readers need the lang attribute.', 'Add lang="en" to the html element.'));
    else passed.push(finding('accessibility', 'passed', 'Language Declared', `lang="${a11y.lang}" set.`));
    if (a11y.imgsNoAlt > 0) issues.push(finding('accessibility', 'critical', `${a11y.imgsNoAlt} Images Missing Alt Text`, 'Images without alt are invisible to screen readers.', 'Add descriptive alt text to all images.'));
    else passed.push(finding('accessibility', 'passed', 'All Images Have Alt Text', 'Every image has an alt attribute.'));
    if (a11y.inputsNoLabel > 0) issues.push(finding('accessibility', 'critical', `${a11y.inputsNoLabel} Unlabelled Form Inputs`, 'Unlabelled inputs cannot be identified by screen readers.', 'Add label elements or aria-label to every input.'));
    if (a11y.buttons > 0) issues.push(finding('accessibility', 'warning', `${a11y.buttons} Buttons Without Names`, 'Icon buttons need aria-label.', 'Add aria-label to icon-only buttons.'));
    if (!a11y.hasSkipLink) issues.push(finding('accessibility', 'warning', 'No Skip Navigation Link', 'Keyboard users must tab through all nav.', 'Add a skip-to-content link.'));
    if (a11y.ariaLandmarks < 3) issues.push(finding('accessibility', 'warning', 'Few ARIA Landmarks', `Only ${a11y.ariaLandmarks} landmark regions.`, 'Use semantic HTML: main, nav, header, footer.'));
    else passed.push(finding('accessibility', 'passed', 'ARIA Landmarks Present', `${a11y.ariaLandmarks} landmark regions detected.`));
  }

  const score = scoreFromIssues(issues, passed);
  return { score, issues, passed };
}

async function auditSecurity(page: Page, responseHeaders: Record<string, string>) {
  const issues: Finding[] = [];
  const passed: Finding[] = [];

  const securityHeaders: Record<string, string | null> = {
    'Content-Security-Policy': responseHeaders['content-security-policy'] || null,
    'X-Frame-Options': responseHeaders['x-frame-options'] || null,
    'X-Content-Type-Options': responseHeaders['x-content-type-options'] || null,
    'Strict-Transport-Security': responseHeaders['strict-transport-security'] || null,
    'Referrer-Policy': responseHeaders['referrer-policy'] || null,
    'Permissions-Policy': responseHeaders['permissions-policy'] || null,
  };

  if (securityHeaders['Content-Security-Policy']) passed.push(finding('security', 'passed', 'Content-Security-Policy Set', 'CSP header protects against XSS and injection attacks.'));
  else issues.push(finding('security', 'critical', 'Missing Content-Security-Policy', 'No CSP header. Your site is vulnerable to XSS attacks.', "Add CSP header: Content-Security-Policy: default-src 'self'"));

  if (securityHeaders['X-Frame-Options']) passed.push(finding('security', 'passed', 'X-Frame-Options Set', 'Clickjacking protection enabled.'));
  else issues.push(finding('security', 'warning', 'Missing X-Frame-Options', 'Site can be embedded in iframes — clickjacking risk.', 'Add X-Frame-Options: SAMEORIGIN header.'));

  if (securityHeaders['X-Content-Type-Options']) passed.push(finding('security', 'passed', 'X-Content-Type-Options Set', 'MIME sniffing attacks prevented.'));
  else issues.push(finding('security', 'warning', 'Missing X-Content-Type-Options', 'Browsers may MIME-sniff responses.', 'Add X-Content-Type-Options: nosniff header.'));

  if (securityHeaders['Strict-Transport-Security']) passed.push(finding('security', 'passed', 'HSTS Enabled', 'HTTP Strict Transport Security enforces HTTPS connections.'));
  else issues.push(finding('security', 'warning', 'Missing HSTS Header', 'HTTPS is not enforced via HSTS header.', 'Add Strict-Transport-Security: max-age=31536000; includeSubDomains'));

  if (securityHeaders['Referrer-Policy']) passed.push(finding('security', 'passed', 'Referrer-Policy Set', 'Referrer information is controlled.'));
  else issues.push(finding('security', 'info', 'No Referrer-Policy', 'Full URL may be sent as referrer to third-party sites.', 'Add Referrer-Policy: strict-origin-when-cross-origin header.'));

  if (securityHeaders['Permissions-Policy']) passed.push(finding('security', 'passed', 'Permissions-Policy Set', 'Browser feature access is controlled.'));
  else issues.push(finding('security', 'info', 'No Permissions-Policy', 'Browser APIs like camera/microphone are not explicitly controlled.', 'Add Permissions-Policy: camera=(), microphone=(), geolocation=() header.'));

  // HTTPS check
  const isHttps = page.url().startsWith('https://');
  if (isHttps) passed.push(finding('security', 'passed', 'HTTPS Enabled', 'Site is served over HTTPS — data is encrypted in transit.'));
  else issues.push(finding('security', 'critical', 'Not Using HTTPS', 'Site is served over HTTP — user data is unencrypted.', 'Get an SSL certificate (free via Let\'s Encrypt) and redirect all HTTP to HTTPS.'));

  // Mixed content
  const mixedContent = await page.evaluate(() => {
    const httpResources = Array.from(document.querySelectorAll('img[src^="http:"], script[src^="http:"], link[href^="http:"]'));
    return httpResources.length;
  });
  if (mixedContent > 0) issues.push(finding('security', 'warning', `${mixedContent} Mixed Content Resources`, 'HTTP resources loaded on HTTPS page — browser may block them.', 'Update all resource URLs to use HTTPS or protocol-relative //'));
  else passed.push(finding('security', 'passed', 'No Mixed Content', 'All resources loaded over HTTPS.'));

  const score = scoreFromIssues(issues, passed);
  return { score, issues, passed, headers: securityHeaders };
}

async function auditUX(page: Page, html: string) {
  const issues: Finding[] = [];
  const passed: Finding[] = [];

  const ux = await page.evaluate(() => {
    const hasViewport = !!document.querySelector('meta[name="viewport"]');
    const viewportContent = document.querySelector('meta[name="viewport"]')?.getAttribute('content') || '';
    const hasFavicon = !!document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    const hasTouchIcon = !!document.querySelector('link[rel="apple-touch-icon"]');
    const hasManifest = !!document.querySelector('link[rel="manifest"]');
    const hasSearch = !!document.querySelector('input[type="search"], [role="search"]');
    const totalLinks = document.querySelectorAll('a').length;
    const externalLinks = Array.from(document.querySelectorAll('a[href^="http"]')).filter(a => {
      try { return new URL((a as HTMLAnchorElement).href).origin !== window.location.origin; } catch { return false; }
    }).length;
    const noopenerLinks = Array.from(document.querySelectorAll('a[target="_blank"]')).filter(a => {
      const rel = a.getAttribute('rel') || '';
      return !rel.includes('noopener');
    }).length;
    const hasFooter = !!document.querySelector('footer');
    const hasBreadcrumb = !!document.querySelector('[aria-label="breadcrumb"], .breadcrumb, nav[class*="bread"]');
    const has404Page = false; // Would need separate request
    return { hasViewport, viewportContent, hasFavicon, hasTouchIcon, hasManifest, hasSearch, totalLinks, externalLinks, noopenerLinks, hasFooter, hasBreadcrumb };
  });

  // Mobile viewport
  if (!ux.hasViewport) issues.push(finding('ux', 'critical', 'No Viewport Meta Tag', 'Without a viewport tag the site will not be mobile-friendly.', 'Add <meta name="viewport" content="width=device-width, initial-scale=1">'));
  else if (!ux.viewportContent.includes('width=device-width')) issues.push(finding('ux', 'warning', 'Viewport Not Responsive', `Viewport content is "${ux.viewportContent}" — may not scale correctly.`, 'Set content="width=device-width, initial-scale=1".'));
  else passed.push(finding('ux', 'passed', 'Mobile Viewport Configured', 'Responsive viewport meta tag is set correctly.'));

  // Mobile rendering test
  const mobilePage = await page.context().newPage();
  await mobilePage.setViewportSize({ width: 375, height: 812 });
  await mobilePage.goto(page.url(), { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  const mobileHasHorizontalScroll = await mobilePage.evaluate(() => document.body.scrollWidth > window.innerWidth).catch(() => false);
  await mobilePage.close();

  if (mobileHasHorizontalScroll) issues.push(finding('ux', 'warning', 'Horizontal Scroll on Mobile', 'Content overflows horizontally on 375px viewport — poor mobile experience.', 'Fix elements with fixed widths wider than the viewport. Use max-width: 100%.'));
  else passed.push(finding('ux', 'passed', 'No Horizontal Scroll on Mobile', 'Page fits correctly within a 375px mobile viewport.'));

  // Favicon
  if (!ux.hasFavicon) issues.push(finding('ux', 'warning', 'No Favicon', 'No favicon detected — browsers show a blank tab icon.', 'Add a favicon.ico and <link rel="icon"> tag.'));
  else passed.push(finding('ux', 'passed', 'Favicon Present', 'Site has a favicon.'));

  // Apple touch icon
  if (!ux.hasTouchIcon) issues.push(finding('ux', 'info', 'No Apple Touch Icon', 'No apple-touch-icon — iOS home screen bookmarks will look generic.', 'Add <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">.'));
  else passed.push(finding('ux', 'passed', 'Apple Touch Icon Present', 'iOS home screen icon is configured.'));

  // PWA manifest
  if (!ux.hasManifest) issues.push(finding('ux', 'info', 'No Web App Manifest', 'No manifest.json found — site cannot be installed as a PWA.', 'Add a web app manifest to enable PWA install prompts.'));
  else passed.push(finding('ux', 'passed', 'Web App Manifest Present', 'PWA manifest.json detected.'));

  // External links security
  if (ux.noopenerLinks > 0) issues.push(finding('ux', 'warning', `${ux.noopenerLinks} External Links Without rel="noopener"`, 'Links opening in new tabs without noopener allow the target page to access window.opener.', 'Add rel="noopener noreferrer" to all target="_blank" links.'));
  else if (ux.externalLinks > 0) passed.push(finding('ux', 'passed', 'External Links Are Secure', 'All external links use rel="noopener".'));

  // Footer
  if (!ux.hasFooter) issues.push(finding('ux', 'info', 'No Footer Detected', 'No <footer> element found.', 'Add a footer with contact info, legal links, and site navigation.'));
  else passed.push(finding('ux', 'passed', 'Footer Present', 'Site has a footer element.'));

  const score = scoreFromIssues(issues, passed);
  return { score, issues, passed, mobileScore: mobileHasHorizontalScroll ? 60 : 100 };
}

export async function runDeepAudit(url: string): Promise<DeepAuditResult> {
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
    });

    const context = await browser.newContext({
      userAgent: 'PulseAI/2.0 (Product Intelligence Deep Auditor)',
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();

    // Track console errors
    let consoleErrors = 0;
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors++; });
    page.on('pageerror', () => consoleErrors++);
    (page as any).__consoleErrors = 0;

    // Track network requests
    let networkRequests = 0;
    let totalPageSize = 0;
    page.on('response', async response => {
      networkRequests++;
      const headers = response.headers();
      const contentLength = headers['content-length'];
      if (contentLength) totalPageSize += parseInt(contentLength, 10);
    });

    // Navigate
    const startTime = Date.now();
    const response = await page.goto(normalizedUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    const responseTime = Date.now() - startTime;

    // Wait for late JS
    await page.waitForTimeout(1500);

    // Update trackers
    (page as any).__consoleErrors = consoleErrors;
    (page as any).__networkRequests = networkRequests;

    const html = await page.content();
    const pageSize = totalPageSize || Buffer.byteLength(html, 'utf-8');
    const responseHeaders: Record<string, string> = {};
    if (response) {
      const headers = response.headers();
      Object.keys(headers).forEach(k => { responseHeaders[k] = headers[k]; });
    }

    // Take screenshot
    const screenshot = await page.screenshot({ type: 'jpeg', quality: 60, fullPage: false });
    const screenshotBase64 = screenshot.toString('base64');

    // Run all audits in parallel
    const [performance, seo, accessibility, security, ux] = await Promise.all([
      auditPerformance(page, responseTime, pageSize, html),
      auditSEO(page, html, normalizedUrl),
      auditAccessibility(page),
      auditSecurity(page, responseHeaders),
      auditUX(page, html),
    ]);

    // Health score — weighted average
    const healthScore = Math.round(
      performance.score * 0.25 +
      seo.score * 0.25 +
      accessibility.score * 0.20 +
      security.score * 0.20 +
      ux.score * 0.10
    );

    return {
      healthScore,
      performanceScore: Math.round(performance.score),
      seoScore: Math.round(seo.score),
      accessibilityScore: Math.round(accessibility.score),
      securityScore: Math.round(security.score),
      uxScore: Math.round(ux.score),
      responseTime,
      pageSize,
      findings: {
        performance: {
          score: performance.score,
          issues: performance.issues,
          passed: performance.passed,
          fcp: performance.fcp,
          lcp: performance.lcp,
          cls: performance.cls,
          tti: performance.tti,
          domNodes: performance.domNodes,
          consoleErrors: performance.consoleErrors,
          networkRequests: performance.networkRequests,
        },
        seo: {
          score: seo.score,
          issues: seo.issues,
          passed: seo.passed,
          headingStructure: seo.headingStructure,
          hasSitemap: seo.hasSitemap,
          hasRobotsTxt: seo.hasRobotsTxt,
          brokenLinks: seo.brokenLinks,
        },
        accessibility: { score: accessibility.score, issues: accessibility.issues, passed: accessibility.passed },
        security: { score: security.score, issues: security.issues, passed: security.passed, headers: security.headers },
        ux: { score: ux.score, issues: ux.issues, passed: ux.passed, mobileScore: ux.mobileScore },
      },
      screenshot: screenshotBase64,
    };

  } finally {
    if (browser) await browser.close();
  }
}
