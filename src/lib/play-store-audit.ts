import type { Finding } from '@/types';

function createFinding(
  category: string,
  severity: 'critical' | 'warning' | 'info' | 'passed',
  title: string,
  description: string,
  recommendation?: string,
): Finding {
  return { category, severity, title, description, recommendation };
}

export interface PlayStoreListingResult {
  score: number;
  appName: string | null;
  packageId: string | null;
  developer: string | null;
  rating: number | null;
  ratingCount: number | null;
  installs: string | null;
  category: string | null;
  hasDescription: boolean;
  descriptionLength: number;
  screenshotCount: number;
  hasFeatureGraphic: boolean;
  hasVideo: boolean;
  contentRating: string | null;
  lastUpdated: string | null;
  issues: Finding[];
  passed: Finding[];
}

function extractPackageId(url: string): string | null {
  const match = url.match(/[?&]id=([a-zA-Z0-9._]+)/);
  return match ? match[1] : null;
}

export async function auditPlayStoreListing(url: string): Promise<PlayStoreListingResult> {
  const issues: Finding[] = [];
  const passed: Finding[] = [];

  const packageId = extractPackageId(url);
  if (!packageId) {
    throw new Error('Could not extract package ID from Play Store URL. Expected format: https://play.google.com/store/apps/details?id=com.example.app');
  }

  const normalizedUrl = url.includes('play.google.com')
    ? url
    : `https://play.google.com/store/apps/details?id=${packageId}`;

  let html = '';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timeout);
    if (!response.ok) {
      throw new Error(`Play Store returned ${response.status}. The app may not exist, be region-restricted, or have been removed.`);
    }
    html = await response.text();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`Could not fetch Play Store listing: ${msg}`);
  }

  const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
  const appName = titleMatch ? titleMatch[1].replace(/\s*-\s*Apps on Google Play\s*$/i, '').trim() : null;

  const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
  const description = descMatch ? descMatch[1] : '';
  const hasDescription = description.length > 0;
  const descriptionLength = description.length;

  const devMatch = html.match(/"name":"([^"]+)","url":"https:\/\/play\.google\.com\/store\/apps\/dev/);
  const developer = devMatch ? devMatch[1] : null;

  const ratingMatch = html.match(/"ratingValue":\s*"?([\d.]+)"?/);
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
  const ratingCountMatch = html.match(/"ratingCount":\s*"?(\d+)"?/);
  const ratingCount = ratingCountMatch ? parseInt(ratingCountMatch[1], 10) : null;

  const installsMatch = html.match(/(\d[\d,]*\+?)\s*(?:installs|downloads)/i);
  const installs = installsMatch ? installsMatch[1] : null;

  const categoryMatch = html.match(/"genre":"([^"]+)"/);
  const category = categoryMatch ? categoryMatch[1] : null;

  const screenshotMatches = html.match(/play-lh\.googleusercontent\.com\/[a-zA-Z0-9_-]+=w\d+-h\d+/g) || [];
  const screenshotCount = new Set(screenshotMatches).size;

  const hasFeatureGraphic = /featuredImage|hero.*image/i.test(html);
  const hasVideo = /youtube\.com\/embed|trailer/i.test(html);

  const contentRatingMatch = html.match(/"contentRating":"([^"]+)"/);
  const contentRating = contentRatingMatch ? contentRatingMatch[1] : null;

  const updatedMatch = html.match(/"datePublished":"([^"]+)"/);
  const lastUpdated = updatedMatch ? updatedMatch[1] : null;

  if (!appName) {
    issues.push(createFinding('playStore', 'warning', 'App Name Not Extracted',
      'Could not extract the app name from the listing. The page structure may have changed or the app may not exist.'));
  } else {
    passed.push(createFinding('playStore', 'passed', 'App Name Found', `Listed as "${appName}".`));
  }

  if (!hasDescription || descriptionLength < 80) {
    issues.push(createFinding('playStore', 'warning', 'Short or Missing Description',
      `Description snippet is ${descriptionLength} characters. A compelling, keyword-rich description improves conversion and ASO.`,
      'Write a description that leads with value proposition, covers key features, and includes relevant search keywords naturally.'));
  } else {
    passed.push(createFinding('playStore', 'passed', 'Description Present', `Description is ${descriptionLength}+ characters.`));
  }

  if (rating != null) {
    if (rating < 3.5) {
      issues.push(createFinding('playStore', 'critical', 'Low Store Rating',
        `Current rating is ${rating.toFixed(1)}★${ratingCount ? ` from ${ratingCount.toLocaleString()} reviews` : ''}. Ratings below 3.5 significantly hurt store visibility and conversion.`,
        'Address top user complaints in reviews, fix critical bugs, and consider in-app review prompts at positive moments.'));
    } else if (rating < 4.0) {
      issues.push(createFinding('playStore', 'warning', 'Moderate Store Rating',
        `Current rating is ${rating.toFixed(1)}★${ratingCount ? ` from ${ratingCount.toLocaleString()} reviews` : ''}. Apps above 4.0★ convert significantly better.`,
        'Review recent negative feedback for common themes and prioritize fixes that affect the most users.'));
    } else {
      passed.push(createFinding('playStore', 'passed', 'Strong Store Rating',
        `${rating.toFixed(1)}★${ratingCount ? ` from ${ratingCount.toLocaleString()} reviews` : ''} — well above the 4.0 conversion threshold.`));
    }
  } else {
    issues.push(createFinding('playStore', 'info', 'Rating Not Detected',
      'Could not extract a rating value from the page. The app may be new or the page structure changed.'));
  }

  if (screenshotCount === 0) {
    issues.push(createFinding('playStore', 'critical', 'No Screenshots Detected',
      'No screenshot images detected on the listing. Screenshots are critical for conversion — most users decide based on visuals.',
      'Add at least 4-8 high-quality screenshots showing core features and value proposition.'));
  } else if (screenshotCount < 4) {
    issues.push(createFinding('playStore', 'warning', `Only ${screenshotCount} Screenshots Detected`,
      'Google Play recommends at least 4-8 screenshots to fully showcase the app.',
      'Add more screenshots covering different features and user flows.'));
  } else {
    passed.push(createFinding('playStore', 'passed', `${screenshotCount} Screenshots Present`,
      'Listing has a solid number of screenshots for users to evaluate the app.'));
  }

  if (!hasVideo) {
    issues.push(createFinding('playStore', 'info', 'No Promo Video Detected',
      'No YouTube trailer/promo video detected. Video listings often see higher conversion rates.',
      'Add a 30-second promo video showing the app in action — Play Store supports YouTube embeds.'));
  } else {
    passed.push(createFinding('playStore', 'passed', 'Promo Video Present', 'A promotional video is embedded in the listing.'));
  }

  if (installs) passed.push(createFinding('playStore', 'passed', 'Install Count Visible', `Reported installs: ${installs}.`));
  if (developer) passed.push(createFinding('playStore', 'passed', 'Developer Identified', `Published by ${developer}.`));

  issues.push(createFinding('playStore', 'info', 'Live Listing Scrape — Limited Field Coverage',
    'This audit scrapes the public Play Store page. Fields like exact keyword rankings, competitor positioning, and full review sentiment require Play Console API access (developer-owned data) which this audit cannot access.',
    'For complete ASO analytics (search rankings, conversion funnel, review trends), connect Google Play Console API with developer credentials.'));

  const score = Math.max(0, Math.min(100,
    100
    - (!appName ? 10 : 0)
    - (!hasDescription || descriptionLength < 80 ? 15 : 0)
    - (rating != null && rating < 3.5 ? 30 : rating != null && rating < 4.0 ? 15 : 0)
    - (rating == null ? 10 : 0)
    - (screenshotCount === 0 ? 25 : screenshotCount < 4 ? 10 : 0)
    - (!hasVideo ? 5 : 0)
  ));

  return {
    score, appName, packageId, developer, rating, ratingCount, installs, category,
    hasDescription, descriptionLength, screenshotCount, hasFeatureGraphic, hasVideo,
    contentRating, lastUpdated, issues, passed,
  };
}
