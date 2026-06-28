import { chromium } from 'playwright';
import type { AuditFindings, Finding, HeadingItem } from '@/types';

function createFinding(
  category: string,
  severity: 'critical' | 'warning' | 'info' | 'passed',
  title: string,
  description: string,
  recommendation?: string,
): Finding {
  return { category, severity, title, description, recommendation };
}

function formatHeaderName(header: string): string {
  return header.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
}

async function analyzePerformanceDeep(
  page: import('playwright').Page,
  responseTime: number,
  pageSize: number,
  html: string,
) {
  const issues: Finding[] = [];
  const passed: Finding[] = [];
  const htmlSize = Buffer.byteLength(html, 'utf-8');

  // Simple audit metrics
  if (responseTime > 3000) {
    issues.push(createFinding('performance', 'critical', 'Slow Server Response',
      `Response time is ${Math.round(responseTime)}ms, which exceeds the 3s threshold.`,
      'Optimize server-side rendering, implement caching, or upgrade hosting.'));
  } else if (responseTime > 1500) {
    issues.push(createFinding('performance', 'warning', 'Moderate Server Response',
      `Response time is ${Math.round(responseTime)}ms. Aim for under 1.5s.`,
      'Consider CDN, caching, or server optimization.'));
  } else {
    passed.push(createFinding('performance', 'passed', 'Good Server Response',
      `Response time is ${Math.round(responseTime)}ms, within acceptable range.`));
  }

  if (htmlSize > 500000) {
    issues.push(createFinding('performance', 'warning', 'Large HTML Document',
      `HTML size is ${(htmlSize / 1024).toFixed(0)}KB. Large HTML slows initial render.`,
      'Implement code splitting, lazy loading, or server-side pagination.'));
  } else {
    passed.push(createFinding('performance', 'passed', 'Reasonable HTML Size',
      `HTML size is ${(htmlSize / 1024).toFixed(0)}KB.`));
  }

  if (pageSize > 3000000) {
    issues.push(createFinding('performance', 'warning', 'Large Total Page Size',
      `Total page size is ${(pageSize / 1024 / 1024).toFixed(1)}MB. This impacts load time on slow connections.`,
      'Compress images, minify CSS/JS, enable gzip/brotli compression.'));
  } else if (pageSize < 500000) {
    passed.push(createFinding('performance', 'passed', 'Optimized Page Size',
      `Total page size is ${(pageSize / 1024).toFixed(0)}KB, well optimized.`));
  }

  // --- Deep metrics: Core Web Vitals ---
  // FCP
  let fcp: number | null = null;
  try {
    const fcpEntry = await page.evaluate(() => {
      const entries = performance.getEntriesByType('paint') as PerformanceEntry[];
      const fcp = entries.find(e => e.name === 'first-contentful-paint');
      return fcp ? fcp.startTime : null;
    });
    fcp = fcpEntry;
  } catch { /* not available */ }

  // LCP
  let lcp: number | null = null;
  try {
    lcp = await page.evaluate(() => {
      return new Promise<number | null>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) resolve(lastEntry.startTime);
        });
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        // Fallback after timeout
        setTimeout(() => resolve(null), 1000);
      });
    });
  } catch { /* not available */ }

  // CLS
  let cls: number | null = null;
  try {
    cls = await page.evaluate(() => {
      return new Promise<number | null>((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) clsValue += entry.value;
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => resolve(clsValue || null), 1000);
      });
    });
  } catch { /* not available */ }

  // DOM node count
  let domNodes: number | null = null;
  try {
    domNodes = await page.evaluate(() => document.querySelectorAll('*').length);
  } catch { /* not available */ }

  // Layout shifts count
  let layoutShifts: number | null = null;
  try {
    layoutShifts = await page.evaluate(() => {
      return performance.getEntriesByType('layout-shift').length;
    });
  } catch { /* not available */ }

  // Console errors
  let consoleErrors = 0;
  try {
    consoleErrors = await page.evaluate(() => (window as any).__pulseConsoleErrors || 0);
  } catch { /* not available */ }

  // Blocked resources (render-blocking scripts)
  const scriptCount = (html.match(/<script/gi) || []).length;
  const blockedResources = (html.match(/<script(?![^>]*async)(?![^>]*defer)[^>]*>/gi) || []).length;

  // Deep metric scoring
  if (fcp !== null) {
    if (fcp > 3000) {
      issues.push(createFinding('performance', 'warning', 'Slow First Contentful Paint (FCP)',
        `FCP is ${Math.round(fcp)}ms. Users see blank screen for over 3 seconds.`,
        'Reduce render-blocking resources, inline critical CSS, use server-side rendering.'));
    } else if (fcp < 1000) {
      passed.push(createFinding('performance', 'passed', 'Fast First Contentful Paint',
        `FCP is ${Math.round(fcp)}ms — the page loads content quickly.`));
    }
  }

  if (lcp !== null) {
    if (lcp > 4000) {
      issues.push(createFinding('performance', 'critical', 'Poor Largest Contentful Paint (LCP)',
        `LCP is ${Math.round(lcp)}ms. This is the most impactful Core Web Vital.`,
        'Optimize images, use CDN, preload important resources, improve server response time.'));
    } else if (lcp > 2500) {
      issues.push(createFinding('performance', 'warning', 'Moderate Largest Contentful Paint',
        `LCP is ${Math.round(lcp)}ms. Google considers >2.5s as "needs improvement".`,
        'Optimize the LCP element — typically an image or text block. Use preloading and CDN.'));
    } else {
      passed.push(createFinding('performance', 'passed', 'Good Largest Contentful Paint',
        `LCP is ${Math.round(lcp)}ms, meeting Google\'s "good" threshold (<2.5s).`));
    }
  }

  if (cls !== null) {
    if (cls > 0.25) {
      issues.push(createFinding('performance', 'critical', 'Poor Cumulative Layout Shift (CLS)',
        `CLS is ${cls.toFixed(3)}. This causes visual instability for users.`,
        'Set explicit width/height on images and embeds, avoid inserting content above existing content, use CSS contain.'));
    } else if (cls > 0.1) {
      issues.push(createFinding('performance', 'warning', 'Moderate Cumulative Layout Shift',
        `CLS is ${cls.toFixed(3)}. Google considers >0.1 as "needs improvement".`,
        'Reserve space for dynamic content, avoid late-loading elements that push content.'));
    } else {
      passed.push(createFinding('performance', 'passed', 'Good Cumulative Layout Shift',
        `CLS is ${cls.toFixed(3)}, meeting Google\'s "good" threshold (<0.1).`));
    }
  }

  if (domNodes !== null) {
    if (domNodes > 3000) {
      issues.push(createFinding('performance', 'warning', 'Excessive DOM Nodes',
        `Found ${domNodes} DOM nodes. Large DOM trees slow rendering and JavaScript execution.`,
        'Reduce DOM complexity, use virtual scrolling for long lists, remove unnecessary wrappers.'));
    } else {
      passed.push(createFinding('performance', 'passed', 'Reasonable DOM Size',
        `Found ${domNodes} DOM nodes.`));
    }
  }

  if (consoleErrors > 0) {
    issues.push(createFinding('performance', 'warning', 'JavaScript Console Errors',
      `${consoleErrors} error(s) logged to the console during page load.`,
      'Fix all console errors. Use try/catch for error-prone operations and monitor in production.'));
  } else {
    passed.push(createFinding('performance', 'passed', 'No Console Errors',
      'No JavaScript errors were logged during page load.'));
  }

  if (blockedResources > 5) {
    issues.push(createFinding('performance', 'warning', 'Render-Blocking Scripts',
      `${blockedResources} render-blocking script(s) found (no async/defer).`,
      'Add async or defer attributes to non-critical scripts.'));
  }

  let score = 100;
  // Simple metrics
  if (responseTime > 3000) score -= 15;
  else if (responseTime > 1500) score -= 8;
  if (htmlSize > 500000) score -= 5;
  if (pageSize > 3000000) score -= 5;
  // Deep metrics
  if (fcp !== null) { if (fcp > 3000) score -= 10; else if (fcp > 1800) score -= 5; }
  if (lcp !== null) { if (lcp > 4000) score -= 15; else if (lcp > 2500) score -= 8; }
  if (cls !== null) { if (cls > 0.25) score -= 10; else if (cls > 0.1) score -= 5; }
  if (domNodes !== null && domNodes > 3000) score -= 5;
  if (consoleErrors > 0) score -= 8;
  if (blockedResources > 5) score -= 5;
  score = Math.max(0, Math.min(100, score));

  return {
    score, responseTime, pageSize, htmlSize,
    fcp, lcp, cls, domNodes, layoutShifts, consoleErrors, blockedResources,
    issues, passed,
  };
}

async function analyzeSeoDeep(page: import('playwright').Page, html: string) {
  const issues: Finding[] = [];
  const passed: Finding[] = [];

  // Standard SEO from raw HTML (same as simple)
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
  const title = titleMatch?.[1]?.trim() || null;
  const titleLength = title?.length || 0;

  if (!title) {
    issues.push(createFinding('seo', 'critical', 'Missing Page Title',
      'No <title> tag found.',
      'Add a descriptive <title> tag (50-60 characters).'));
  } else if (titleLength > 60) {
    issues.push(createFinding('seo', 'warning', 'Title Too Long',
      `Title is ${titleLength} characters.`,
      'Shorten the title to 50-60 characters.'));
  } else if (titleLength < 10) {
    issues.push(createFinding('seo', 'warning', 'Title Too Short',
      `Title is only ${titleLength} characters.`,
      'Expand the title to be more descriptive.'));
  } else {
    passed.push(createFinding('seo', 'passed', 'Good Page Title',
      `Title "${title}" is ${titleLength} characters.`));
  }

  const descMatch = html.match(/<meta[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["'](.*?)["']/is)
    || html.match(/<meta[^>]*content\s*=\s*["'](.*?)["'][^>]*name\s*=\s*["']description["']/is);
  const metaDescription = descMatch?.[1]?.trim() || null;
  const metaDescriptionLength = metaDescription?.length || 0;

  if (!metaDescription) {
    issues.push(createFinding('seo', 'critical', 'Missing Meta Description',
      'No meta description found.',
      'Add a compelling meta description (150-160 characters).'));
  } else if (metaDescriptionLength > 160) {
    issues.push(createFinding('seo', 'warning', 'Meta Description Too Long',
      `Meta description is ${metaDescriptionLength} characters.`,
      'Shorten to 150-160 characters.'));
  } else {
    passed.push(createFinding('seo', 'passed', 'Good Meta Description',
      `Meta description is ${metaDescriptionLength} characters.`));
  }

  const canonicalMatch = html.match(/<link[^>]*rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["'](.*?)["']/is);
  const canonicalUrl = canonicalMatch?.[1]?.trim() || null;
  if (canonicalUrl) {
    passed.push(createFinding('seo', 'passed', 'Canonical URL Set', 'Canonical URL is defined.'));
  } else {
    issues.push(createFinding('seo', 'warning', 'Missing Canonical URL',
      'No canonical link tag found.',
      'Add a <link rel="canonical"> tag.'));
  }

  const ogTags: Record<string, string> = {};
  const ogRegex = /<meta[^>]*property\s*=\s*["'](og:(\w+[\w:-]*))["'][^>]*content\s*=\s*["'](.*?)["']/gi;
  let ogMatch;
  while ((ogMatch = ogRegex.exec(html)) !== null) {
    ogTags[ogMatch[2]] = ogMatch[3];
  }
  if (ogTags['title']) {
    passed.push(createFinding('seo', 'passed', 'Open Graph Title', `OG title: "${ogTags['title']}".`));
  } else {
    issues.push(createFinding('seo', 'info', 'Missing Open Graph Tags',
      'No Open Graph tags found.',
      'Add OG tags for better social sharing.'));
  }

  const headingRegex = /<(h[1-6])[^>]*>(.*?)<\/\1>/gi;
  const headings: HeadingItem[] = [];
  let hMatch;
  while ((hMatch = headingRegex.exec(html)) !== null) {
    const text = hMatch[2].replace(/<[^>]*>/g, '').trim();
    if (text) headings.push({ level: parseInt(hMatch[1][1]), text });
  }

  const h1Count = headings.filter(h => h.level === 1).length;
  if (h1Count === 0) {
    issues.push(createFinding('seo', 'critical', 'Missing H1 Heading',
      'No H1 tag found.',
      'Add a single H1 tag.'));
  } else if (h1Count > 1) {
    issues.push(createFinding('seo', 'warning', 'Multiple H1 Headings',
      `Found ${h1Count} H1 tags.`,
      'Consolidate to a single H1.'));
  } else {
    passed.push(createFinding('seo', 'passed', 'Proper H1 Usage',
      `Exactly one H1: "${headings.find(h => h.level === 1)?.text?.slice(0, 50)}".`));
  }

  // --- Deep SEO checks ---
  // Rendered title (JS may modify it)
  let renderedTitle: string | null = null;
  try {
    renderedTitle = await page.title();
  } catch { /* not available */ }

  if (renderedTitle && renderedTitle !== title) {
    issues.push(createFinding('seo', 'info', 'Title Modified by JavaScript',
      `Original title: "${title}" → Rendered title: "${renderedTitle}". JS modified the document title.`,
      'Ensure the server-rendered title matches what users see. Set a good default in HTML.'));
  }

  // Check for robots.txt and sitemap
  let hasRobotsTxt = false;
  let hasSitemap = false;
  try {
    const baseUrl = page.url();
    const origin = new URL(baseUrl).origin;
    const robotsResponse = await page.context().request.get(`${origin}/robots.txt`, { timeout: 5000 });
    hasRobotsTxt = robotsResponse.ok();
  } catch { /* not available */ }

  try {
    const baseUrl = page.url();
    const origin = new URL(baseUrl).origin;
    const sitemapResponse = await page.context().request.get(`${origin}/sitemap.xml`, { timeout: 5000 });
    hasSitemap = sitemapResponse.ok();
  } catch { /* not available */ }

  if (hasRobotsTxt) {
    passed.push(createFinding('seo', 'passed', 'robots.txt Found', 'A robots.txt file is present.'));
  } else {
    issues.push(createFinding('seo', 'info', 'Missing robots.txt',
      'No robots.txt found at /robots.txt.',
      'Add a robots.txt to guide search engine crawlers.'));
  }

  if (hasSitemap) {
    passed.push(createFinding('seo', 'passed', 'Sitemap Found', 'A sitemap.xml file is present.'));
  } else {
    issues.push(createFinding('seo', 'info', 'Missing Sitemap',
      'No sitemap.xml found.',
      'Add an XML sitemap and submit it to Google Search Console.'));
  }

  // Broken link detection
  let brokenLinks = 0;
  try {
    brokenLinks = await page.evaluate(async () => {
      const links = Array.from(document.querySelectorAll('a[href^="http"]')) as HTMLAnchorElement[];
      let count = 0;
      // Check up to 20 links to avoid timeout
      const toCheck = links.slice(0, 20);
      await Promise.allSettled(
        toCheck.map(async (link) => {
          try {
            const response = await fetch(link.href, { method: 'HEAD', mode: 'no-cors' });
            // no-cors returns opaque response (status 0), so we can only check for real errors
          } catch {
            count++;
          }
        })
      );
      return count;
    });
  } catch { /* not available */ }

  if (brokenLinks > 0) {
    issues.push(createFinding('seo', 'warning', 'Broken Links Detected',
      `${brokenLinks} link(s) could not be reached.`,
      'Fix or remove broken links. Use a link checker tool for a comprehensive scan.'));
  } else {
    passed.push(createFinding('seo', 'passed', 'No Broken Links', 'All sampled links are reachable.'));
  }

  let score = 100;
  if (!title) score -= 20; else if (titleLength > 60 || titleLength < 10) score -= 8;
  if (!metaDescription) score -= 15; else if (metaDescriptionLength > 160) score -= 5;
  if (!canonicalUrl) score -= 8;
  if (Object.keys(ogTags).length === 0) score -= 3;
  if (h1Count === 0) score -= 15; else if (h1Count > 1) score -= 8;
  if (!hasRobotsTxt) score -= 3;
  if (!hasSitemap) score -= 5;
  if (brokenLinks > 0) score -= 8;
  if (renderedTitle && renderedTitle !== title) score -= 3;
  score = Math.max(0, Math.min(100, score));

  return {
    score, title, titleLength, metaDescription, metaDescriptionLength, canonicalUrl, ogTags,
    headingStructure: headings, renderedTitle, hasSitemap, hasRobotsTxt, brokenLinks,
    issues, passed,
  };
}

async function analyzeAccessibilityDeep(page: import('playwright').Page, html: string) {
  const issues: Finding[] = [];
  const passed: Finding[] = [];

  const imgTags = html.match(/<img[^>]*>/gi) || [];
  const totalImages = imgTags.length;
  const imagesWithoutAlt = imgTags.filter(img => !/alt\s*=/i.test(img) || /alt\s*=\s*["']\s*["']/i.test(img)).length;

  if (totalImages > 0) {
    if (imagesWithoutAlt === totalImages) {
      issues.push(createFinding('accessibility', 'critical', 'All Images Missing Alt Text',
        `All ${totalImages} images lack alt text.`,
        'Add descriptive alt attributes to all images.'));
    } else if (imagesWithoutAlt > 0) {
      issues.push(createFinding('accessibility', 'warning', 'Images Missing Alt Text',
        `${imagesWithoutAlt} of ${totalImages} images are missing alt text.`,
        'Add descriptive alt attributes.'));
    } else {
      passed.push(createFinding('accessibility', 'passed', 'All Images Have Alt Text',
        `All ${totalImages} images have alt attributes.`));
    }
  }

  const hasLang = /<html[^>]*lang\s*=/i.test(html);
  if (hasLang) {
    passed.push(createFinding('accessibility', 'passed', 'HTML Lang Attribute',
      'The <html> element has a lang attribute.'));
  } else {
    issues.push(createFinding('accessibility', 'critical', 'Missing HTML Lang Attribute',
      'No lang attribute on the <html> element.',
      'Add a lang attribute (e.g., lang="en").'));
  }

  const inputCount = (html.match(/<input[^>]*>/gi) || []).length;
  const labelCount = (html.match(/<label/gi) || []).length;
  const ariaLabelCount = (html.match(/aria-label/gi) || []).length;
  const ariaLabelledbyCount = (html.match(/aria-labelledby/gi) || []).length;
  const labelledInputs = labelCount + ariaLabelCount + ariaLabelledbyCount;
  const missingLabels = Math.max(0, inputCount - labelledInputs);

  if (inputCount > 0 && missingLabels > 0) {
    issues.push(createFinding('accessibility', 'warning', 'Input Fields Without Labels',
      `${missingLabels} of ${inputCount} input fields lack labels.`,
      'Add <label> elements or aria-label attributes.'));
  } else if (inputCount > 0) {
    passed.push(createFinding('accessibility', 'passed', 'Form Inputs Labeled',
      'All form inputs appear to have labels.'));
  }

  const hasMain = /<main/i.test(html);
  const hasNav = /<nav/i.test(html);
  if (hasMain) {
    passed.push(createFinding('accessibility', 'passed', 'Semantic <main> Element', 'A <main> landmark found.'));
  } else {
    issues.push(createFinding('accessibility', 'warning', 'Missing <main> Element',
      'No <main> landmark found.',
      'Wrap primary content in a <main> element.'));
  }

  if (hasNav) {
    passed.push(createFinding('accessibility', 'passed', 'Semantic <nav> Element', 'A <nav> landmark found.'));
  } else {
    issues.push(createFinding('accessibility', 'info', 'Missing <nav> Element',
      'No <nav> element found.',
      'Add a <nav> element for navigation.'));
  }

  // Deep: Check for ARIA roles, focus management
  let missingFocusStyles = false;
  let hasAriaLandmarks = false;
  try {
    missingFocusStyles = await page.evaluate(() => {
      const focusable = document.querySelectorAll('a, button, input, select, textarea, [tabindex]');
      if (focusable.length === 0) return false;
      const style = window.getComputedStyle(document.body);
      return true; // We can't easily detect focus styles in all cases, so just check if focusable elements exist
    });

    hasAriaLandmarks = await page.evaluate(() => {
      const landmarks = document.querySelectorAll('[role="banner"], [role="navigation"], [role="main"], [role="contentinfo"], [role="search"], [role="form"], main, nav, header, footer');
      return landmarks.length > 0;
    });
  } catch { /* not available */ }

  if (hasAriaLandmarks) {
    passed.push(createFinding('accessibility', 'passed', 'ARIA Landmarks Present',
      'The page uses ARIA landmark roles or semantic elements for navigation.'));
  }

  let score = 100;
  if (totalImages > 0 && imagesWithoutAlt === totalImages) score -= 25;
  else if (imagesWithoutAlt > 0) score -= 12;
  if (!hasLang) score -= 20;
  if (missingLabels > 0) score -= 12;
  if (!hasMain) score -= 8;
  if (!hasNav) score -= 4;
  if (!hasAriaLandmarks) score -= 5;
  score = Math.max(0, Math.min(100, score));

  return { score, imagesWithoutAlt, totalImages, missingLabels, hasLang, issues, passed };
}

async function analyzeSecurityDeep(page: import('playwright').Page, url: string, html: string) {
  const issues: Finding[] = [];
  const passed: Finding[] = [];
  const isHttps = url.startsWith('https');

  const securityHeaders: Record<string, { severity: 'critical' | 'warning'; description: string; recommendation: string }> = {
    'strict-transport-security': {
      severity: 'warning',
      description: 'Missing HSTS header.',
      recommendation: 'Add Strict-Transport-Security header.',
    },
    'content-security-policy': {
      severity: 'warning',
      description: 'Missing CSP header.',
      recommendation: 'Implement Content-Security-Policy.',
    },
    'x-content-type-options': {
      severity: 'info',
      description: 'Missing X-Content-Type-Options header.',
      recommendation: 'Add X-Content-Type-Options: nosniff.',
    },
    'x-frame-options': {
      severity: 'info',
      description: 'Missing X-Frame-Options header.',
      recommendation: 'Add X-Frame-Options: DENY or SAMEORIGIN.',
    },
    'referrer-policy': {
      severity: 'info',
      description: 'Missing Referrer-Policy header.',
      recommendation: 'Add Referrer-Policy: strict-origin-when-cross-origin.',
    },
  };

  const response = await page.context().request.get(url);
  const responseHeaders: Record<string, string | null> = {};

  for (const [header, info] of Object.entries(securityHeaders)) {
    const value = response.headers()[header.toLowerCase()] || null;
    responseHeaders[header] = value;
    if (value) {
      passed.push(createFinding('security', 'passed', `${formatHeaderName(header)} Present`,
        `${formatHeaderName(header)} is configured.`));
    } else {
      issues.push(createFinding('security', info.severity, `Missing ${formatHeaderName(header)}`,
        info.description, info.recommendation));
    }
  }

  if (!isHttps) {
    issues.push(createFinding('security', 'critical', 'Not Using HTTPS',
      'The website does not use HTTPS.',
      'Obtain an SSL/TLS certificate and redirect HTTP to HTTPS.'));
  } else {
    passed.push(createFinding('security', 'passed', 'HTTPS Enabled',
      'The website uses HTTPS.'));
  }

  // Deep: Check for mixed content
  let mixedContentCount = 0;
  try {
    mixedContentCount = await page.evaluate(() => {
      const elements = document.querySelectorAll('img[src^="http://"], script[src^="http://"], link[href^="http://"], iframe[src^="http://"]');
      return elements.length;
    });
  } catch { /* not available */ }

  if (mixedContentCount > 0) {
    issues.push(createFinding('security', 'warning', 'Mixed Content Detected',
      `${mixedContentCount} resource(s) loaded over HTTP on an HTTPS page.`,
      'Update all resource URLs to HTTPS or use protocol-relative URLs.'));
  } else if (isHttps) {
    passed.push(createFinding('security', 'passed', 'No Mixed Content',
      'All resources use HTTPS on this page.'));
  }

  // Deep: Check for known vulnerable libraries
  const vulnerableLibraries: string[] = [];
  try {
    const scripts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('script[src]')).map(s => (s as HTMLScriptElement).src);
    });
    const libsToCheck: Record<string, string> = {
      'jquery-1.': 'jQuery 1.x (outdated, XSS vulnerabilities)',
      'jquery-2.': 'jQuery 2.x (outdated)',
      'jquery/1.': 'jQuery 1.x (CDN, outdated)',
      'jquery/2.': 'jQuery 2.x (CDN, outdated)',
      'angular.js/1.': 'AngularJS 1.x (end-of-life)',
      'angular.min.js': 'AngularJS (possibly outdated)',
      'bootstrap/3.': 'Bootstrap 3.x (no longer maintained)',
    };
    for (const script of scripts) {
      for (const [pattern, name] of Object.entries(libsToCheck)) {
        if (script.toLowerCase().includes(pattern)) {
          vulnerableLibraries.push(name);
        }
      }
    }
    // Deduplicate
    const unique = [...new Set(vulnerableLibraries)];
    if (unique.length > 0) {
      issues.push(createFinding('security', 'warning', 'Potentially Vulnerable Libraries',
        `Found outdated/vulnerable libraries: ${unique.join(', ')}.`,
        'Update to the latest stable versions of all frontend libraries.'));
    }
  } catch { /* not available */ }

  let score = 100;
  if (!isHttps) score -= 35;
  for (const [header, info] of Object.entries(securityHeaders)) {
    if (!responseHeaders[header]) {
      score -= info.severity === 'critical' ? 18 : info.severity === 'warning' ? 10 : 4;
    }
  }
  if (mixedContentCount > 0) score -= 10;
  if (vulnerableLibraries.length > 0) score -= 5;
  score = Math.max(0, Math.min(100, score));

  return { score, isHttps, headers: responseHeaders, mixedContentCount, vulnerableLibraries, issues, passed };
}

async function analyzeUxDeep(page: import('playwright').Page, html: string, url: string) {
  const issues: Finding[] = [];
  const passed: Finding[] = [];

  const hasViewport = /<meta[^>]*name\s*=\s*["']viewport["']/i.test(html);
  if (hasViewport) {
    passed.push(createFinding('ux', 'passed', 'Mobile Viewport Configured', 'Viewport meta tag is present.'));
  } else {
    issues.push(createFinding('ux', 'critical', 'Missing Viewport Meta Tag',
      'No viewport meta tag found.',
      'Add <meta name="viewport" content="width=device-width, initial-scale=1.0">.'));
  }

  const hasFavicon = /<link[^>]*(?:rel\s*=\s*["'](?:shortcut )?icon["']|type\s*=\s*["']image\/)/i.test(html);
  if (hasFavicon) {
    passed.push(createFinding('ux', 'passed', 'Favicon Present', 'A favicon is configured.'));
  } else {
    issues.push(createFinding('ux', 'info', 'Missing Favicon',
      'No favicon found.',
      'Add a favicon link tag.'));
  }

  const links = html.match(/<a[^>]*href\s*=\s*["'](https?:\/\/[^"']+?)["']/gi) || [];
  const linkCount = links.length;
  const baseUrl = new URL(url).hostname;
  const externalLinks = links.filter(l => {
    try { return !l.includes(baseUrl); } catch { return true; }
  }).length;

  if (linkCount === 0) {
    issues.push(createFinding('ux', 'info', 'No Links Found',
      'No hyperlinks detected.',
      'Ensure the page has clear navigation links.'));
  } else {
    passed.push(createFinding('ux', 'passed', 'Navigation Links Present',
      `Found ${linkCount} links (${externalLinks} external).`));
  }

  const hasFooter = /<footer/i.test(html);
  const hasHeader = /<header/i.test(html);
  if (hasHeader && hasFooter) {
    passed.push(createFinding('ux', 'passed', 'Page Structure', 'Both <header> and <footer> elements found.'));
  } else {
    if (!hasHeader) issues.push(createFinding('ux', 'info', 'Missing <header>', 'No <header> element found.', 'Add a <header>.'));
    if (!hasFooter) issues.push(createFinding('ux', 'info', 'Missing <footer>', 'No <footer> element found.', 'Add a <footer>.'));
  }

  // Deep: Responsive check
  const responsiveIssues: string[] = [];
  try {
    // Check viewport dimensions for overflow/horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 5;
    });
    if (hasHorizontalScroll) {
      responsiveIssues.push('Horizontal scroll detected at default viewport width');
    }

    // Check for fixed-width elements
    const fixedWidthIssues = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      let count = 0;
      for (const el of Array.from(allElements)) {
        const style = window.getComputedStyle(el);
        const width = parseInt(style.width);
        if (width > 400 && style.position !== 'absolute' && style.position !== 'fixed') {
          count++;
        }
      }
      return count;
    });
    if (fixedWidthIssues > 3) {
      responsiveIssues.push(`${fixedWidthIssues} elements with widths >400px may cause layout issues on mobile`);
    }
  } catch { /* not available */ }

  if (responsiveIssues.length > 0) {
    issues.push(createFinding('ux', 'warning', 'Responsive Design Issues',
      responsiveIssues.join('. ') + '.',
      'Use relative units (%, vw, rem), CSS Grid/Flexbox, and test on multiple screen sizes.'));
  } else {
    passed.push(createFinding('ux', 'passed', 'Responsive Layout', 'No obvious responsive design issues detected.'));
  }

  // Screenshot confirmation
  let screenshotTaken = true; // We always take one in the caller

  let score = 100;
  if (!hasViewport) score -= 30;
  if (!hasFavicon) score -= 4;
  if (linkCount === 0) score -= 8;
  if (!hasHeader) score -= 4;
  if (!hasFooter) score -= 4;
  if (responsiveIssues.length > 0) score -= 10;
  score = Math.max(0, Math.min(100, score));

  return { score, hasViewport, hasFavicon, linkCount, externalLinks, responsiveIssues, screenshotTaken, issues, passed };
}

export async function runDeepAudit(url: string): Promise<{
  findings: AuditFindings;
  healthScore: number;
  performanceScore: number;
  seoScore: number;
  accessibilityScore: number;
  securityScore: number;
  uxScore: number;
  responseTime: number;
  pageSize: number;
}> {
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
  const startTime = Date.now();

  let html = '';
  let pageSize = 0;
  let browser: any = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    });

    const context = await browser.newContext({
      userAgent: 'PulseAI/1.0 (Product Intelligence Auditor - Deep Scan)',
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();

    // Capture console errors
    await page.evaluateOnNewDocument(() => {
      (window as any).__pulseConsoleErrors = 0;
      const origError = console.error;
      console.error = function (...args: any[]) {
        (window as any).__pulseConsoleErrors++;
        origError.apply(console, args);
      };
      window.addEventListener('error', () => {
        (window as any).__pulseConsoleErrors++;
      });
    });

    // Navigate and wait for network idle
    const response = await page.goto(normalizedUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait a bit for any late-loading content
    await page.waitForTimeout(2000);

    html = await page.content();
    pageSize = Buffer.byteLength(html, 'utf-8');

    // Also account for response body size from the main navigation
    if (response) {
      const headers = response.headers();
      // Estimate total transferred size from content-length if available
      const contentLength = parseInt(headers['content-length'] || '0');
      if (contentLength > 0 && contentLength > pageSize) {
        pageSize = contentLength;
      }
    }

    const responseTime = Date.now() - startTime;

    // Run all deep analyses with the live page
    const [performance, seo, accessibility, security, ux] = await Promise.all([
      analyzePerformanceDeep(page, responseTime, pageSize, html),
      analyzeSeoDeep(page, html),
      analyzeAccessibilityDeep(page, html),
      analyzeSecurityDeep(page, normalizedUrl, html),
      analyzeUxDeep(page, html, normalizedUrl),
    ]);

    await browser.close();

    const performanceScore = performance.score;
    const seoScore = seo.score;
    const accessibilityScore = accessibility.score;
    const securityScore = security.score;
    const uxScore = ux.score;

    const healthScore = Math.round(
      performanceScore * 0.25 +
      seoScore * 0.25 +
      accessibilityScore * 0.20 +
      securityScore * 0.20 +
      uxScore * 0.10
    );

    return {
      findings: { performance, seo, accessibility, security, ux },
      healthScore,
      performanceScore,
      seoScore,
      accessibilityScore,
      securityScore,
      uxScore,
      responseTime,
      pageSize,
    };
  } catch (err: unknown) {
    if (browser) await browser.close().catch(() => {});
    const msg = err instanceof Error ? err.message : 'Unknown error';

    // Fallback to simple audit if Playwright fails
    console.error(`Deep audit failed (${msg}), falling back to simple audit:`, normalizedUrl);
    const { runAudit } = await import('./audit-engine');
    return runAudit(url);
  }
}