import type { AuditFindings, Finding, HeadingItem } from '@/types';

interface AuditInput {
  url: string;
  html: string;
  responseTime: number;
  pageSize: number;
  headers: Record<string, string>;
}

function createFinding(
  category: string,
  severity: 'critical' | 'warning' | 'info' | 'passed',
  title: string,
  description: string,
  recommendation?: string
): Finding {
  return { category, severity, title, description, recommendation };
}

function analyzePerformance(html: string, responseTime: number, pageSize: number) {
  const issues: Finding[] = [];
  const passed: Finding[] = [];
  const htmlSize = Buffer.byteLength(html, 'utf-8');

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

  const scriptCount = (html.match(/<script/gi) || []).length;
  if (scriptCount > 20) {
    issues.push(createFinding('performance', 'warning', 'Excessive Scripts',
      `Found ${scriptCount} script tags. This can block rendering.`,
      'Bundle scripts, use async/defer attributes, remove unused code.'));
  }

  const inlineStyleCount = (html.match(/style\s*=/gi) || []).length;
  if (inlineStyleCount > 30) {
    issues.push(createFinding('performance', 'info', 'Many Inline Styles',
      `Found ${inlineStyleCount} inline style attributes. Consider using CSS classes.`,
      'Move inline styles to external CSS for better caching and maintainability.'));
  }

  let score = 100;
  if (responseTime > 3000) score -= 35;
  else if (responseTime > 1500) score -= 15;
  else if (responseTime > 800) score -= 5;
  if (htmlSize > 500000) score -= 15;
  if (pageSize > 3000000) score -= 15;
  if (scriptCount > 20) score -= 10;
  if (inlineStyleCount > 30) score -= 5;
  score = Math.max(0, Math.min(100, score));

  return { score, responseTime, pageSize, htmlSize, issues, passed };
}

function analyzeSeo(html: string) {
  const issues: Finding[] = [];
  const passed: Finding[] = [];

  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
  const title = titleMatch?.[1]?.trim() || null;
  const titleLength = title?.length || 0;

  if (!title) {
    issues.push(createFinding('seo', 'critical', 'Missing Page Title',
      'No <title> tag found. This is critical for search engine rankings.',
      'Add a descriptive <title> tag (50-60 characters) to every page.'));
  } else if (titleLength > 60) {
    issues.push(createFinding('seo', 'warning', 'Title Too Long',
      `Title is ${titleLength} characters. Google typically displays 50-60 characters.`,
      'Shorten the title to 50-60 characters for optimal display in search results.'));
  } else if (titleLength < 10) {
    issues.push(createFinding('seo', 'warning', 'Title Too Short',
      `Title is only ${titleLength} characters. It may not be descriptive enough.`,
      'Expand the title to be more descriptive (aim for 50-60 characters).'));
  } else {
    passed.push(createFinding('seo', 'passed', 'Good Page Title',
      `Title "${title}" is ${titleLength} characters, within the recommended range.`));
  }

  const descMatch = html.match(/<meta[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["'](.*?)["']/is)
    || html.match(/<meta[^>]*content\s*=\s*["'](.*?)["'][^>]*name\s*=\s*["']description["']/is);
  const metaDescription = descMatch?.[1]?.trim() || null;
  const metaDescriptionLength = metaDescription?.length || 0;

  if (!metaDescription) {
    issues.push(createFinding('seo', 'critical', 'Missing Meta Description',
      'No meta description found. Search engines may auto-generate one, which is often suboptimal.',
      'Add a compelling meta description (150-160 characters) for each page.'));
  } else if (metaDescriptionLength > 160) {
    issues.push(createFinding('seo', 'warning', 'Meta Description Too Long',
      `Meta description is ${metaDescriptionLength} characters. It may be truncated in search results.`,
      'Shorten to 150-160 characters for full display in search results.'));
  } else {
    passed.push(createFinding('seo', 'passed', 'Good Meta Description',
      `Meta description is ${metaDescriptionLength} characters.`));
  }

  const canonicalMatch = html.match(/<link[^>]*rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["'](.*?)["']/is);
  const canonicalUrl = canonicalMatch?.[1]?.trim() || null;
  if (canonicalUrl) {
    passed.push(createFinding('seo', 'passed', 'Canonical URL Set',
      `Canonical URL is defined, preventing duplicate content issues.`));
  } else {
    issues.push(createFinding('seo', 'warning', 'Missing Canonical URL',
      'No canonical link tag found. This can lead to duplicate content issues.',
      'Add a <link rel="canonical"> tag to specify the preferred URL.'));
  }

  const ogTags: Record<string, string> = {};
  const ogRegex = /<meta[^>]*property\s*=\s*["'](og:(\w+[\w:-]*))["'][^>]*content\s*=\s*["'](.*?)["']/gi;
  let ogMatch;
  while ((ogMatch = ogRegex.exec(html)) !== null) {
    ogTags[ogMatch[2]] = ogMatch[3];
  }
  if (ogTags['title']) {
    passed.push(createFinding('seo', 'passed', 'Open Graph Title',
      `OG title is set: "${ogTags['title']}".`));
  } else {
    issues.push(createFinding('seo', 'info', 'Missing Open Graph Tags',
      'No Open Graph tags found. Social media sharing may not display rich previews.',
      'Add OG tags (og:title, og:description, og:image, og:url) for better social sharing.'));
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
      'No H1 tag found. The H1 is the most important heading for SEO and accessibility.',
      'Add a single H1 tag that describes the page content.'));
  } else if (h1Count > 1) {
    issues.push(createFinding('seo', 'warning', 'Multiple H1 Headings',
      `Found ${h1Count} H1 tags. Only one H1 per page is recommended.`,
      'Consolidate to a single H1 tag per page.'));
  } else {
    passed.push(createFinding('seo', 'passed', 'Proper H1 Usage',
      `Exactly one H1 tag found: "${headings.find(h => h.level === 1)?.text?.slice(0, 50)}".`));
  }

  let score = 100;
  if (!title) score -= 25; else if (titleLength > 60 || titleLength < 10) score -= 10;
  if (!metaDescription) score -= 20; else if (metaDescriptionLength > 160) score -= 8;
  if (!canonicalUrl) score -= 10;
  if (Object.keys(ogTags).length === 0) score -= 5;
  if (h1Count === 0) score -= 20; else if (h1Count > 1) score -= 10;
  score = Math.max(0, Math.min(100, score));

  return { score, title, titleLength, metaDescription, metaDescriptionLength, canonicalUrl, ogTags, headingStructure: headings, issues, passed };
}

function analyzeAccessibility(html: string) {
  const issues: Finding[] = [];
  const passed: Finding[] = [];

  const imgTags = html.match(/<img[^>]*>/gi) || [];
  const totalImages = imgTags.length;
  const imagesWithoutAlt = imgTags.filter(img => !/alt\s*=/i.test(img) || /alt\s*=\s*["']\s*["']/i.test(img)).length;

  if (totalImages > 0) {
    if (imagesWithoutAlt === totalImages) {
      issues.push(createFinding('accessibility', 'critical', 'All Images Missing Alt Text',
        `All ${totalImages} images lack descriptive alt text. Screen readers cannot interpret these images.`,
        'Add descriptive alt attributes to all images.'));
    } else if (imagesWithoutAlt > 0) {
      issues.push(createFinding('accessibility', 'warning', 'Images Missing Alt Text',
        `${imagesWithoutAlt} of ${totalImages} images are missing alt text.`,
        'Add descriptive alt attributes to all images for screen reader accessibility.'));
    } else {
      passed.push(createFinding('accessibility', 'passed', 'All Images Have Alt Text',
        `All ${totalImages} images have alt attributes.`));
    }
  }

  const hasLang = /<html[^>]*lang\s*=/i.test(html);
  if (hasLang) {
    passed.push(createFinding('accessibility', 'passed', 'HTML Lang Attribute',
      'The <html> element has a lang attribute, helping screen readers with pronunciation.'));
  } else {
    issues.push(createFinding('accessibility', 'critical', 'Missing HTML Lang Attribute',
      'No lang attribute on the <html> element. Screen readers need this for correct pronunciation.',
      'Add a lang attribute to the <html> element (e.g., lang="en").'));
  }

  const inputCount = (html.match(/<input[^>]*>/gi) || []).length;
  const labelCount = (html.match(/<label/gi) || []).length;
  const ariaLabelCount = (html.match(/aria-label/gi) || []).length;
  const ariaLabelledbyCount = (html.match(/aria-labelledby/gi) || []).length;
  const labelledInputs = labelCount + ariaLabelCount + ariaLabelledbyCount;
  const missingLabels = Math.max(0, inputCount - labelledInputs);

  if (inputCount > 0 && missingLabels > 0) {
    issues.push(createFinding('accessibility', 'warning', 'Input Fields Without Labels',
      `${missingLabels} of ${inputCount} input fields appear to lack associated labels.`,
      'Add <label> elements or aria-label attributes to all form inputs.'));
  } else if (inputCount > 0) {
    passed.push(createFinding('accessibility', 'passed', 'Form Inputs Labeled',
      'All form inputs appear to have associated labels.'));
  }

  const hasMain = /<main/i.test(html);
  if (hasMain) {
    passed.push(createFinding('accessibility', 'passed', 'Semantic <main> Element',
      'A `main` landmark element found — screen readers can navigate by landmark.'));
  } else {
    issues.push(createFinding('accessibility', 'warning', 'Missing <main> Element',
      'No `main` landmark element found. Screen readers rely on landmarks for navigation.',
      'Wrap the primary content in a <main> element.'));
  }

  const hasNav = /<nav/i.test(html);
  if (hasNav) {
    passed.push(createFinding('accessibility', 'passed', 'Semantic <nav> Element',
      'A `nav` landmark element found.'));
  } else {
    issues.push(createFinding('accessibility', 'info', 'Missing <nav> Element',
      'No <nav> element found. Consider adding one for navigation landmarks.'));
  }

  let score = 100;
  if (totalImages > 0 && imagesWithoutAlt === totalImages) score -= 30;
  else if (imagesWithoutAlt > 0) score -= 15;
  if (!hasLang) score -= 25;
  if (missingLabels > 0) score -= 15;
  if (!hasMain) score -= 10;
  if (!hasNav) score -= 5;
  score = Math.max(0, Math.min(100, score));

  return { score, imagesWithoutAlt, totalImages, missingLabels, hasLang, issues, passed };
}

function analyzeSecurity(url: string, headers: Record<string, string>) {
  const issues: Finding[] = [];
  const passed: Finding[] = [];
  const isHttps = url.startsWith('https');

  const securityHeaders: Record<string, { severity: 'critical' | 'warning'; description: string; recommendation: string }> = {
    'strict-transport-security': {
      severity: 'warning',
      description: 'Missing HSTS header. The site may be vulnerable to protocol downgrade attacks.',
      recommendation: 'Add Strict-Transport-Security header with a max-age of at least 1 year.',
    },
    'content-security-policy': {
      severity: 'warning',
      description: 'Missing Content-Security-Policy header. The site is more vulnerable to XSS attacks.',
      recommendation: 'Implement a Content-Security-Policy to control which resources can be loaded.',
    },
    'x-content-type-options': {
      severity: 'info',
      description: 'Missing X-Content-Type-Options header. Browsers may MIME-sniff responses.',
      recommendation: 'Add X-Content-Type-Options: nosniff header.',
    },
    'x-frame-options': {
      severity: 'info',
      description: 'Missing X-Frame-Options header. The page could be embedded in iframes on other sites.',
      recommendation: 'Add X-Frame-Options: DENY or SAMEORIGIN header.',
    },
    'referrer-policy': {
      severity: 'info',
      description: 'Missing Referrer-Policy header. Referrer information may leak to third parties.',
      recommendation: 'Add Referrer-Policy: strict-origin-when-cross-origin header.',
    },
  };

  const headerResults: Record<string, string | null> = {};
  for (const [header, info] of Object.entries(securityHeaders)) {
    const value = headers[header.toLowerCase()] || headers[header] || null;
    headerResults[header] = value;
    if (value) {
      passed.push(createFinding('security', 'passed', `${formatHeaderName(header)} Present`,
        `The ${formatHeaderName(header)} is configured.`));
    } else {
      issues.push(createFinding('security', info.severity, `Missing ${formatHeaderName(header)}`,
        info.description, info.recommendation));
    }
  }

  if (!isHttps) {
    issues.push(createFinding('security', 'critical', 'Not Using HTTPS',
      'The website does not use HTTPS. All data is transmitted in plain text.',
      'Obtain an SSL/TLS certificate (free via Let\'s Encrypt) and redirect HTTP to HTTPS.'));
  } else {
    passed.push(createFinding('security', 'passed', 'HTTPS Enabled',
      'The website uses HTTPS, encrypting data in transit.'));
  }

  let score = 100;
  if (!isHttps) score -= 40;
  for (const [header, info] of Object.entries(securityHeaders)) {
    if (!headerResults[header]) {
      score -= info.severity === 'critical' ? 20 : info.severity === 'warning' ? 12 : 5;
    }
  }
  score = Math.max(0, Math.min(100, score));

  return { score, isHttps, headers: headerResults, issues, passed };
}

function analyzeUx(html: string, url: string) {
  const issues: Finding[] = [];
  const passed: Finding[] = [];

  const hasViewport = /<meta[^>]*name\s*=\s*["']viewport["']/i.test(html);
  if (hasViewport) {
    passed.push(createFinding('ux', 'passed', 'Mobile Viewport Configured',
      'The viewport meta tag is present, ensuring proper mobile rendering.'));
  } else {
    issues.push(createFinding('ux', 'critical', 'Missing Viewport Meta Tag',
      'No viewport meta tag found. The page will not render properly on mobile devices.',
      'Add <meta name="viewport" content="width=device-width, initial-scale=1.0">.'));
  }

  const hasFavicon = /<link[^>]*(?:rel\s*=\s*["'](?:shortcut )?icon["']|type\s*=\s*["']image\/)/i.test(html);
  if (hasFavicon) {
    passed.push(createFinding('ux', 'passed', 'Favicon Present',
      'A favicon is configured, improving browser tab identification.'));
  } else {
    issues.push(createFinding('ux', 'info', 'Missing Favicon',
      'No favicon found. The browser will show a default icon.',
      'Add a favicon link tag to improve brand recognition in browser tabs.'));
  }

  const links = html.match(/<a[^>]*href\s*=\s*["'](https?:\/\/[^"']+?)["']/gi) || [];
  const linkCount = links.length;
  const baseUrl = new URL(url).hostname;
  const externalLinks = links.filter(l => {
    try {
      return !l.includes(baseUrl);
    } catch { return true; }
  }).length;

  if (linkCount === 0) {
    issues.push(createFinding('ux', 'info', 'No Links Found',
      'No hyperlinks were detected on the page. Users have no navigation path.',
      'Ensure the page has clear navigation links.'));
  } else {
    passed.push(createFinding('ux', 'passed', 'Navigation Links Present',
      `Found ${linkCount} links (${externalLinks} external) for user navigation.`));
  }

  const hasFooter = /<footer/i.test(html);
  const hasHeader = /<header/i.test(html);
  if (hasHeader && hasFooter) {
    passed.push(createFinding('ux', 'passed', 'Page Structure',
      'Both header and footer elements found, indicating good page structure.'));
  } else {
    if (!hasHeader) issues.push(createFinding('ux', 'info', 'Missing <header>', 'No <header> element found.', 'Add a <header> for consistent branding and navigation.'));
    if (!hasFooter) issues.push(createFinding('ux', 'info', 'Missing <footer>', 'No <footer> element found.', 'Add a <footer> for secondary links and legal info.'));
  }

  let score = 100;
  if (!hasViewport) score -= 40;
  if (!hasFavicon) score -= 5;
  if (linkCount === 0) score -= 10;
  if (!hasHeader) score -= 5;
  if (!hasFooter) score -= 5;
  score = Math.max(0, Math.min(100, score));

  return { score, hasViewport, hasFavicon, linkCount, externalLinks, issues, passed };
}

function formatHeaderName(header: string): string {
  return header.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
}

}

// ── Priority 2: Technology Audit ─────────────────────────────────────────────

function analyzeTechnology(html: string, headers: Record<string, string>) {
  const issues: Finding[] = [];
  const passed: Finding[] = [];

  // Framework detection
  let framework: string | null = null;
  if (html.includes('__NEXT_DATA__') || html.includes('/_next/')) framework = 'Next.js';
  else if (html.includes('ng-version') || html.includes('angular')) framework = 'Angular';
  else if (html.includes('data-reactroot') || html.includes('react')) framework = 'React';
  else if (html.includes('__vue') || html.includes('data-v-')) framework = 'Vue.js';
  else if (html.includes('wp-content') || html.includes('wp-includes')) framework = 'WordPress';
  else if (html.includes('Shopify.theme') || html.includes('cdn.shopify')) framework = 'Shopify';
  else if (html.includes('wix.com') || html.includes('X-Wix-')) framework = 'Wix';
  else if (html.includes('squarespace') || html.includes('Squarespace')) framework = 'Squarespace';
  else if (html.includes('webflow')) framework = 'Webflow';

  // CMS detection
  let cms: string | null = null;
  if (html.includes('wp-content')) cms = 'WordPress';
  else if (html.includes('Drupal')) cms = 'Drupal';
  else if (html.includes('Joomla')) cms = 'Joomla';
  else if (html.includes('Ghost')) cms = 'Ghost';

  // Analytics
  const analytics: string[] = [];
  if (html.includes('google-analytics.com') || html.includes('gtag(') || html.includes('UA-')) analytics.push('Google Analytics');
  if (html.includes('mixpanel')) analytics.push('Mixpanel');
  if (html.includes('segment.com') || html.includes('analytics.js')) analytics.push('Segment');
  if (html.includes('hotjar')) analytics.push('Hotjar');
  if (html.includes('clarity.ms') || html.includes('Microsoft Clarity')) analytics.push('Microsoft Clarity');
  if (html.includes('heap.io') || html.includes('heapanalytics')) analytics.push('Heap');
  if (html.includes('posthog')) analytics.push('PostHog');
  if (html.includes('plausible.io')) analytics.push('Plausible');

  // Tag managers
  const hasTagManager = html.includes('googletagmanager.com') || html.includes('GTM-') || html.includes('tealium') || html.includes('segment');

  // CDN detection
  let cdnProvider: string | null = null;
  const serverHeader = headers['server'] || headers['x-served-by'] || '';
  const cdnHeader = headers['x-cdn'] || headers['x-cache'] || headers['cf-ray'] || '';
  if (headers['cf-ray'] || cdnHeader.includes('cloudflare')) cdnProvider = 'Cloudflare';
  else if (serverHeader.includes('AmazonS3') || headers['x-amz-cf-id']) cdnProvider = 'AWS CloudFront';
  else if (headers['x-vercel-cache'] || headers['x-vercel-id']) cdnProvider = 'Vercel Edge';
  else if (serverHeader.includes('Fastly') || headers['x-fastly']) cdnProvider = 'Fastly';
  else if (headers['x-akamai-transformed']) cdnProvider = 'Akamai';
  const cdnDetected = !!cdnProvider;

  // JS Libraries
  const jsLibraries: string[] = [];
  if (html.includes('jquery')) jsLibraries.push('jQuery');
  if (html.includes('lodash')) jsLibraries.push('Lodash');
  if (html.includes('bootstrap')) jsLibraries.push('Bootstrap');
  if (html.includes('tailwind')) jsLibraries.push('Tailwind CSS');
  if (html.includes('material-ui') || html.includes('@mui')) jsLibraries.push('Material UI');

  // Third-party scripts (count external scripts)
  const scriptMatches = html.match(/<script[^>]+src=["'][^"']+["']/gi) || [];
  const thirdPartyScripts = scriptMatches
    .map(s => { const m = s.match(/src=["']([^"']+)/); return m ? m[1] : ''; })
    .filter(s => s && !s.startsWith('/') && !s.startsWith('.'));

  // Findings
  if (!analytics.length) {
    issues.push(createFinding('technology', 'warning', 'No Analytics Detected',
      'No analytics platform detected. You cannot measure user behaviour or conversion rates without tracking.',
      'Add Google Analytics 4, Plausible, or PostHog to track user behaviour.'));
  } else {
    passed.push(createFinding('technology', 'passed', `Analytics Configured`,
      `Analytics detected: ${analytics.join(', ')}.`));
  }

  if (!cdnDetected) {
    issues.push(createFinding('technology', 'info', 'No CDN Detected',
      'No Content Delivery Network detected. A CDN improves load times for global users.',
      'Use Cloudflare (free tier), AWS CloudFront, or Vercel Edge for CDN acceleration.'));
  } else {
    passed.push(createFinding('technology', 'passed', `CDN Active: ${cdnProvider}`,
      `Content is served via ${cdnProvider}, improving global performance.`));
  }

  if (hasTagManager) {
    passed.push(createFinding('technology', 'passed', 'Tag Manager Detected',
      'A tag manager is present, enabling flexible analytics and tracking deployment.'));
  }

  if (thirdPartyScripts.length > 10) {
    issues.push(createFinding('technology', 'warning', `${thirdPartyScripts.length} Third-Party Scripts`,
      `${thirdPartyScripts.length} external scripts detected. Each adds network round-trips and can block rendering.`,
      'Audit and remove unused third-party scripts. Lazy-load non-critical ones.'));
  } else if (thirdPartyScripts.length > 0) {
    passed.push(createFinding('technology', 'passed', `Reasonable Third-Party Script Count`,
      `${thirdPartyScripts.length} external scripts — within acceptable range.`));
  }

  if (framework) {
    passed.push(createFinding('technology', 'passed', `Framework: ${framework}`,
      `Built with ${framework}${cms ? ` / ${cms}` : ''}.`));
  }

  const score = Math.max(0, Math.min(100,
    100
    - (analytics.length === 0 ? 15 : 0)
    - (!cdnDetected ? 10 : 0)
    - (thirdPartyScripts.length > 10 ? 10 : 0)
  ));

  return { score, framework, cms, analytics, cdnDetected, cdnProvider, jsLibraries, thirdPartyScripts, hasTagManager, issues, passed };
}

// ── Priority 3: Content Audit ─────────────────────────────────────────────────

function analyzeContent(html: string) {
  const issues: Finding[] = [];
  const passed: Finding[] = [];

  // Strip tags to get plain text
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Word count
  const words = text.split(/\s+/).filter(w => w.length > 1);
  const wordCount = words.length;

  // Sentence count for avg length
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const avgSentenceLength = sentences.length > 0 ? Math.round(wordCount / sentences.length) : 0;

  // Flesch-Kincaid readability (simplified)
  const syllables = words.reduce((acc, word) => {
    const s = word.toLowerCase().replace(/[^a-z]/g, '');
    const count = s.replace(/[^aeiou]/g, '').length || 1;
    return acc + count;
  }, 0);
  const fkScore = sentences.length > 0
    ? Math.round(206.835 - 1.015 * (wordCount / sentences.length) - 84.6 * (syllables / wordCount))
    : 50;
  const readabilityScore = Math.max(0, Math.min(100, fkScore));

  let readabilityGrade = 'Very difficult';
  if (readabilityScore >= 90) readabilityGrade = 'Very easy (5th grade)';
  else if (readabilityScore >= 80) readabilityGrade = 'Easy (6th grade)';
  else if (readabilityScore >= 70) readabilityGrade = 'Fairly easy (7th grade)';
  else if (readabilityScore >= 60) readabilityGrade = 'Standard (8-9th grade)';
  else if (readabilityScore >= 50) readabilityGrade = 'Fairly difficult (10-12th grade)';
  else if (readabilityScore >= 30) readabilityGrade = 'Difficult (college)';

  // CTA quality
  const ctaKeywords = /\b(get started|sign up|buy now|start free|try free|book a demo|contact us|learn more|download|subscribe|join|shop now|order now|request a demo|get a quote|start today)\b/gi;
  const ctaMatches = text.match(ctaKeywords) || [];
  const ctaCount = ctaMatches.length;
  const ctaQuality: 'good' | 'weak' | 'missing' = ctaCount >= 2 ? 'good' : ctaCount === 1 ? 'weak' : 'missing';

  // Privacy & legal
  const hasPrivacyPolicy = /privacy\s*policy|privacy\s*notice/i.test(html);
  const hasTerms = /terms\s*(of\s*)?(service|use)|terms\s*&\s*conditions/i.test(html);

  // Duplicate headings
  const headingTexts = (html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi) || [])
    .map(h => h.replace(/<[^>]+>/g, '').trim().toLowerCase());
  const uniqueHeadings = new Set(headingTexts);
  const duplicateHeadings = headingTexts.length - uniqueHeadings.size;

  // Findings
  if (readabilityScore < 50) {
    issues.push(createFinding('content', 'warning', 'Content Is Hard to Read',
      `Flesch readability score is ${readabilityScore} (${readabilityGrade}). Most web content should score 60+.`,
      'Use shorter sentences, simpler words, and active voice. Aim for a readability score above 60.'));
  } else {
    passed.push(createFinding('content', 'passed', 'Good Readability',
      `Flesch readability score is ${readabilityScore} (${readabilityGrade}).`));
  }

  if (avgSentenceLength > 25) {
    issues.push(createFinding('content', 'warning', 'Sentences Are Too Long',
      `Average sentence length is ${avgSentenceLength} words. Long sentences reduce comprehension.`,
      'Keep sentences under 20 words. Break complex sentences into two.'));
  } else if (avgSentenceLength > 0) {
    passed.push(createFinding('content', 'passed', 'Good Sentence Length',
      `Average sentence length is ${avgSentenceLength} words — within the recommended range.`));
  }

  if (ctaQuality === 'missing') {
    issues.push(createFinding('content', 'critical', 'No Clear Call-to-Action',
      'No primary CTA found (e.g. "Get Started", "Sign Up", "Buy Now"). Without a CTA, visitors have no obvious next step.',
      'Add at least one prominent CTA above the fold. Use action verbs: "Start Free Trial", "Book a Demo".'));
  } else if (ctaQuality === 'weak') {
    issues.push(createFinding('content', 'warning', 'Only One CTA Detected',
      'Only one call-to-action found. Multiple CTAs at key moments in the user journey improve conversion.',
      'Add CTAs after key sections: hero, features, testimonials, and at the bottom of the page.'));
  } else {
    passed.push(createFinding('content', 'passed', `Strong CTA Presence`,
      `${ctaCount} CTAs detected including: ${[...new Set(ctaMatches)].slice(0, 3).join(', ')}.`));
  }

  if (!hasPrivacyPolicy) {
    issues.push(createFinding('content', 'critical', 'No Privacy Policy Link',
      'No privacy policy detected. This may violate GDPR, DPDP Act, and other regulations.',
      'Add a privacy policy page and link it in your footer. Required for all websites collecting user data.'));
  } else {
    passed.push(createFinding('content', 'passed', 'Privacy Policy Present',
      'A privacy policy link was detected.'));
  }

  if (!hasTerms) {
    issues.push(createFinding('content', 'warning', 'No Terms of Service',
      'No Terms of Service or Terms of Use detected.',
      'Add a Terms of Service page protecting your business from liability.'));
  } else {
    passed.push(createFinding('content', 'passed', 'Terms of Service Present',
      'Terms of Service link detected.'));
  }

  if (wordCount < 200) {
    issues.push(createFinding('content', 'warning', 'Very Little Content',
      `Only ${wordCount} words detected. Thin content signals low value to search engines.`,
      'Add more substantive content: feature descriptions, benefits, social proof, and FAQs.'));
  } else {
    passed.push(createFinding('content', 'passed', 'Sufficient Content Volume',
      `${wordCount.toLocaleString()} words detected — sufficient content depth.`));
  }

  if (duplicateHeadings > 0) {
    issues.push(createFinding('content', 'info', `${duplicateHeadings} Duplicate Heading${duplicateHeadings > 1 ? 's' : ''}`,
      `${duplicateHeadings} repeated heading text found. Duplicate headings confuse screen readers and dilute SEO.`,
      'Make each heading unique and descriptive.'));
  }

  const score = Math.max(0, Math.min(100,
    100
    - (readabilityScore < 50 ? 15 : 0)
    - (ctaQuality === 'missing' ? 25 : ctaQuality === 'weak' ? 10 : 0)
    - (!hasPrivacyPolicy ? 20 : 0)
    - (!hasTerms ? 10 : 0)
    - (wordCount < 200 ? 10 : 0)
    - (duplicateHeadings * 5)
  ));

  return { score, readabilityScore, readabilityGrade, wordCount, avgSentenceLength, ctaCount, ctaQuality, hasPrivacyPolicy, hasTerms, duplicateHeadings, issues, passed };
}

export async function runAudit(url: string): Promise<{
  findings: AuditFindings;
  healthScore: number;
  performanceScore: number;
  seoScore: number;
  accessibilityScore: number;
  securityScore: number;
  uxScore: number;
  technologyScore: number;
  contentScore: number;
  responseTime: number;
  pageSize: number;
}> {
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
  const startTime = Date.now();

  let html = '';
  let responseHeaders: Record<string, string> = {};
  let responseSize = 0;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PulseAI/1.0 (Product Intelligence Auditor)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    html = await response.text();
    responseSize = html.length;

    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    html = `<!-- Fetch error: ${msg} -->`;
    responseSize = 0;
  }

  const responseTime = Date.now() - startTime;

  const performance = analyzePerformance(html, responseTime, responseSize);
  const seo = analyzeSeo(html);
  const accessibility = analyzeAccessibility(html);
  const security = analyzeSecurity(normalizedUrl, responseHeaders);
  const ux = analyzeUx(html, normalizedUrl);
  const technology = analyzeTechnology(html, responseHeaders);
  const content = analyzeContent(html);

  const performanceScore = performance.score;
  const seoScore = seo.score;
  const accessibilityScore = accessibility.score;
  const securityScore = security.score;
  const uxScore = ux.score;
  const technologyScore = technology.score;
  const contentScore = content.score;

  // Updated weighting with 7 categories
  const healthScore = Math.round(
    performanceScore * 0.20 +
    seoScore * 0.20 +
    accessibilityScore * 0.15 +
    securityScore * 0.15 +
    uxScore * 0.10 +
    contentScore * 0.15 +
    technologyScore * 0.05
  );

  return {
    findings: { performance, seo, accessibility, security, ux, technology, content },
    healthScore,
    performanceScore,
    seoScore,
    accessibilityScore,
    securityScore,
    uxScore,
    technologyScore,
    contentScore,
    responseTime,
    pageSize: responseSize,
  };
}