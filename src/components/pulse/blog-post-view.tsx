'use client';

import Image from 'next/image';
import { useAppStore } from '@/store/use-app-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Clock, HeartPulse } from 'lucide-react';

const heroImage = '/pulse-dashboard-mockup.png';
const securityImage = '/security-blog-thumb.png';
const devImage = '/android-dev-blog-thumb.png';

interface BlogArticle {
  title: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  excerpt: string;
  content: React.ReactNode;
}

const blogArticles: Record<string, BlogArticle> = {
  '0': {
    title: 'Why Your Lighthouse Score Is Lying to You',
    category: 'Performance',
    date: 'Jun 24, 2026',
    readTime: '6 min read',
    image: heroImage,
    excerpt: "If you've ever run a Lighthouse audit and felt relieved by a 95+ performance score, you might want to hold off on celebrating. Lighthouse is useful, but the number it gives you is often far removed from what your actual users experience.",
    content: (
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-bold mb-3">The Clean Room Problem</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Lighthouse spins up a fresh Chromium instance in a controlled environment every time you run an audit. This means no other tabs are open, no extensions are loaded, no background processes are competing for CPU or memory, and the network is either disabled or perfectly simulated. Your real users, on the other hand, are browsing with ten tabs open, three extensions running, a VPN active, and a cellular connection that fluctuates between 4G and 3G. The performance of your site in that environment is dramatically different from what Lighthouse measures in its sterile lab.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Think of it like testing a car's fuel efficiency on a treadmill in a climate-controlled lab versus driving it in stop-and-go traffic on a rainy highway. The lab results are precise, but they are not representative of real-world conditions. This is the fundamental problem with relying solely on Lighthouse scores: you are optimizing for a benchmark that does not reflect the environment your users actually inhabit. Developers who obsess over Lighthouse scores often find that their real-world Core Web Vitals, measured through Chrome User Experience Report (CrUX) data, tell a completely different story.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Furthermore, Lighthouse applies artificial network throttling and CPU throttling that may not accurately represent any particular device or connection. The 4x CPU slowdown and simulated Slow 3G or Fast 3G profiles are approximations at best. A mid-range Android phone on a real cellular network experiences throttling patterns that are far more complex and unpredictable than anything Lighthouse can replicate in a clean-room test. This is why you can have a perfect Lighthouse score and still receive complaints from mobile users about slow load times and janky scrolling.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">Lab Data vs Field Data</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The web performance community has drawn a clear distinction between lab data and field data for years, yet many teams still treat them as interchangeable. Lab data is what Lighthouse produces: a synthetic measurement taken in a controlled environment. Field data is what CrUX collects from millions of real Chrome users who have opted into usage statistics. The divergence between these two data sources can be staggering. Google's own documentation acknowledges that lab scores are meant for debugging and development, while field scores are the metrics that actually impact search rankings and user experience.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We analyzed 12,000 websites audited through Pulse AI and found a consistent pattern: sites with Lighthouse performance scores above 90 frequently had CrUX Largest Contentful Paint (LCP) values in the "poor" category. The reasons are numerous and compound each other. Lighthouse loads the page exactly once, so it does not capture the variability introduced by service worker caching on repeat visits, nor does it reflect the impact of CDN cache misses on first visits from geographic regions far from your origin server. Real users also trigger dynamic content loading, personalized experiences, and A/B tests that Lighthouse never encounters during its single-pass audit.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The bottom line is that lab data tells you how your site performs under ideal conditions, while field data tells you how your site performs for actual humans. If you are making optimization decisions based on Lighthouse alone, you are optimizing for a scenario that essentially never occurs in the wild. This does not mean Lighthouse is worthless — it is an excellent debugging tool — but it should never be your primary performance metric. You need to look at CrUX field data to understand what your users are actually experiencing, and that requires a tool that goes beyond synthetic testing.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">What to Measure Instead</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            If Lighthouse scores are unreliable as a standalone metric, what should you measure instead? The answer is Chrome User Experience Report (CrUX) field data, which provides real-world performance metrics collected from actual Chrome users across the globe. CrUX gives you the 75th percentile values for LCP, First Input Delay (FID), and Cumulative Layout Shift (CLS) — the three Core Web Vitals that Google uses as ranking signals. These values represent the experience of 75% of your users, which is a far more meaningful benchmark than a single synthetic run in a clean browser.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Beyond Core Web Vitals, you should also track Time to Interactive (TTI), Total Blocking Time (TBT), and the impact of third-party scripts on your page load. Third-party scripts — analytics, ad trackers, chat widgets, social embeds — are often the single largest contributors to poor real-world performance, yet they are frequently invisible in Lighthouse audits because they load from cached CDN endpoints that respond quickly in lab conditions. In the real world, these scripts introduce render-blocking behavior, layout shifts, and network contention that can double or triple your page load time. Pulse AI's deep audit mode measures all of these factors using a real Playwright browser that simulates genuine user conditions more closely than any synthetic test can achieve.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Additionally, monitor your server response time (TTFB) across different geographic regions, not just from the location where you run Lighthouse. A server in Virginia might respond in 50 milliseconds to a Lighthouse test run from the same data center, but a user in Mumbai could experience 300-millisecond response times due to network latency. Pulse AI captures these real-world metrics and provides a holistic picture of your site's performance that goes far beyond what any single Lighthouse run can reveal. The goal is not to get a perfect score on an artificial benchmark, but to deliver a genuinely fast experience to every user, regardless of their device, location, or network conditions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">How Pulse AI Handles This</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Pulse AI was designed from the ground up to address the shortcomings of Lighthouse-style synthetic audits. When you run a deep audit in Pulse AI, we spin up a real Playwright browser — not a simulated Chromium instance — and navigate to your site exactly as a user would. This means we capture actual Core Web Vitals measurements, real console errors, genuine layout shifts, and the true impact of third-party scripts on your page load performance. The results are far more representative of what your users experience than any Lighthouse score can provide.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Our deep audit mode goes beyond simple HTTP-level analysis. We measure server response time from multiple geographic perspectives, detect render-blocking resources that slow initial paint, identify unused JavaScript that bloats your bundle, and flag third-party scripts that introduce excessive blocking time. The AI-powered summary then translates these technical findings into plain-English action items that tell you exactly what to fix and why it matters. You get a 0-100 health score across five categories — performance, SEO, accessibility, security, and UX — along with specific, actionable recommendations for improving each one.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            If you have been relying on Lighthouse scores to evaluate your site's performance, try running a free deep audit on Pulse AI and compare the results. You will likely find that your real-world performance is worse than your Lighthouse score suggests — and Pulse AI will tell you exactly why, with specific fixes you can implement today. Stop optimizing for a number that does not reflect reality. Start measuring what your users actually experience.
          </p>
        </section>
      </div>
    ),
  },
  '1': {
    title: 'The Security Headers 90% of Websites Forget',
    category: 'Security',
    date: 'Jun 18, 2026',
    readTime: '8 min read',
    image: securityImage,
    excerpt: 'We ran Pulse AI security audits on over 12,000 websites and found a consistent pattern: the vast majority are missing at least three critical HTTP security headers.',
    content: (
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-bold mb-3">Content-Security-Policy (CSP)</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Content-Security-Policy is arguably the most powerful HTTP security header available to web developers. It allows you to specify exactly which sources of content — scripts, styles, images, fonts, and more — are permitted to load on your pages. A properly configured CSP can entirely prevent Cross-Site Scripting (XSS) attacks, which remain one of the most common and dangerous vulnerabilities on the web. Despite its importance, our analysis of 12,000 websites found that fewer than 15% had a Content-Security-Policy header configured at all, and fewer than 3% had one that was both secure and functional.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The reason so few sites implement CSP is that it requires careful, source-by-source enumeration of every resource your site loads. A misconfigured CSP can break your site entirely by blocking essential scripts, styles, or third-party integrations. Many developers start with a report-only policy — using <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">Content-Security-Policy-Report-Only</code> — to monitor violations before enforcing the policy. This is a sound approach, but far too many teams never move from report-only to enforcement, leaving their sites vulnerable indefinitely. Pulse AI's security audit checks both the presence and the strictness of your CSP, flagging common misconfigurations like <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">unsafe-inline</code>, wildcard sources, and missing nonce or hash directives.
          </p>
          <div className="rounded-lg border bg-muted/30 p-4 my-4">
            <p className="text-sm font-mono text-xs break-all">
              Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-abc123'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
            </p>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            A strong CSP like the one above restricts scripts to your own origin plus those with a specific nonce, allows inline styles for common CSS frameworks, permits images from your origin plus data URIs and HTTPS sources, and prevents your site from being embedded in iframes or having its base URI hijacked. If you have not implemented a Content-Security-Policy yet, start with a report-only mode and work toward full enforcement. It is one of the single most impactful security improvements you can make to any website.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">HTTP Strict Transport Security (HSTS)</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            HSTS tells the user's browser to only connect to your site over HTTPS, never over plain HTTP. Once a browser receives an HSTS header, it will automatically upgrade any HTTP request to HTTPS for the duration specified in the <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">max-age</code> directive. This prevents man-in-the-middle attacks that exploit the initial HTTP-to-HTTPS redirect, which is a vulnerable window where an attacker could intercept the connection before the upgrade occurs. Despite being simple to implement — it is a single HTTP header — roughly 60% of websites we audited had no HSTS header at all.
          </p>
          <div className="rounded-lg border bg-muted/30 p-4 my-4">
            <p className="text-sm font-mono text-xs break-all">
              Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
            </p>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The header above tells the browser to enforce HTTPS for one year (31,536,000 seconds), apply the policy to all subdomains, and allow the domain to be included in the browser's built-in HSTS preload list. The preload list is particularly important because it provides protection even before a user has visited your site for the first time — the browser ships with a hardcoded list of HSTS domains, so there is no initial vulnerable HTTP request at all. You can submit your domain to the HSTS Preload List at <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">hstspreload.org</code>, but be aware that inclusion is effectively permanent and applies to all subdomains.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            If your site is accessible over HTTP, you are leaving your users vulnerable to protocol downgrade attacks and cookie hijacking. Implementing HSTS is a one-line change in your web server configuration or CDN settings, and it provides a massive security improvement with zero performance overhead. Pulse AI checks for the presence, duration, includeSubDomains flag, and preload status of your HSTS header, and flags any weakness or omission in the security audit report.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">X-Frame-Options &amp; X-Content-Type-Options</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            These two headers are older than CSP and HSTS, but they remain essential and are still missing from the majority of websites. <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">X-Frame-Options</code> prevents your site from being embedded in an iframe on another domain, which is the primary defense against clickjacking attacks. In a clickjacking attack, an attacker loads your site in a transparent iframe and overlays invisible buttons that trick your users into performing actions they did not intend — such as changing their password, transferring funds, or granting permissions. The header has two main directives: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">DENY</code> (blocks all framing) and <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">SAMEORIGIN</code> (allows framing only by your own domain).
          </p>
          <div className="rounded-lg border bg-muted/30 p-4 my-4">
            <p className="text-sm font-mono text-xs break-all">
              X-Frame-Options: DENY
            </p>
            <p className="text-sm font-mono text-xs break-all mt-2">
              X-Content-Type-Options: nosniff
            </p>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">X-Content-Type-Options: nosniff</code> prevents MIME-type sniffing, where the browser attempts to guess the type of a resource and may execute it as something other than intended. Without this header, a browser could interpret an uploaded text file as JavaScript and execute it, leading to a stored XSS vulnerability. The <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">nosniff</code> directive forces the browser to respect the <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">Content-Type</code> header sent by the server and refuse to execute content that does not match. It is a simple, one-value header that provides a critical defense against a class of content injection attacks.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            While <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">X-Frame-Options</code> is largely superseded by the <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">frame-ancestors</code> directive in CSP, you should still include both for maximum browser compatibility, especially for older browsers that do not support CSP. Pulse AI checks for the presence and correct configuration of both headers and will flag any site that is missing either one, or that has them configured with insecure values.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">Referrer-Policy</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The Referrer-Policy header controls how much referrer information is sent when a user navigates away from your site. By default, browsers send the full URL — including path, query parameters, and potentially sensitive data — as the Referer header to the destination site. This can inadvertently leak confidential information, such as session tokens, search queries, or internal page URLs, to third-party sites. The <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">Referrer-Policy</code> header gives you precise control over this behavior.
          </p>
          <div className="rounded-lg border bg-muted/30 p-4 my-4">
            <p className="text-sm font-mono text-xs break-all">
              Referrer-Policy: strict-origin-when-cross-origin
            </p>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">strict-origin-when-cross-origin</code> value is the recommended default for most sites. It sends the full URL when navigating within the same origin, but only sends the origin (domain without path or query) when navigating to a different origin. This means internal navigation retains useful analytics referrer data, while cross-origin navigation does not leak sensitive path or parameter information. For sites handling particularly sensitive data — such as healthcare, financial, or authentication pages — <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">no-referrer</code> or <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">same-origin</code> provide even stricter protection by sending no referrer data at all to external sites.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Despite being a trivially easy header to set, roughly 70% of websites we audited had no Referrer-Policy header, leaving them at the mercy of browser defaults that can vary between Chrome, Firefox, and Safari. This inconsistency means the same site may leak different amounts of information depending on which browser the user happens to be running. Setting an explicit Referrer-Policy eliminates this ambiguity and gives you consistent, predictable control over referrer data across all browsers. Pulse AI checks for the presence of this header and recommends the most appropriate policy based on your site's content and functionality.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">Check Your Headers Now</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Security headers are the low-hanging fruit of web security. They require no code changes to your application logic, no architectural redesigns, and no performance trade-offs. They are simple HTTP headers that you add to your web server, CDN, or reverse proxy configuration, and they provide immediate, meaningful protection against some of the most common attacks on the web. If your site is missing even one of the headers discussed in this article — and statistically, it is missing several — you have a clear, actionable item that will improve your security posture today.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Run a free security audit on Pulse AI to see exactly which headers your site is missing, which are misconfigured, and what specific changes you need to make. Our AI-powered summary will explain each finding in plain English and prioritize the most critical issues first. Do not wait for a security incident to take headers seriously — check your site now and close the gaps before someone else exploits them.
          </p>
        </section>
      </div>
    ),
  },
  '2': {
    title: 'Android APK Security: From Permissions to Pinning',
    category: 'Android',
    date: 'Jun 10, 2026',
    readTime: '5 min read',
    image: devImage,
    excerpt: 'A practical walkthrough of what happens when you upload an APK to Pulse AI — permissions analysis, tracker detection, secret scanning, and certificate checks.',
    content: (
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-bold mb-3">Permission Analysis</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The first thing Pulse AI does when you upload an APK is parse the <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">AndroidManifest.xml</code> to extract every permission the app requests. The Android permission system is the primary gateway between an app and sensitive device capabilities — camera, microphone, location, contacts, SMS, storage, and more. A well-designed app should request the minimum set of permissions necessary to function, and any excessive or unusual permission request is a red flag that warrants investigation. Pulse AI categorizes every permission into normal, dangerous, and signature-level groups, highlighting the ones that pose the greatest risk to user privacy and security.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Dangerous permissions are particularly concerning because they grant access to sensitive user data or device capabilities that could be abused. The Android system requires runtime user approval for these permissions on modern Android versions, but many users blindly tap "Allow" without understanding the implications. If an app requests <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">READ_CONTACTS</code> and <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">RECORD_AUDIO</code> but is ostensibly a simple calculator, that is a clear warning sign. Pulse AI flags such mismatches between declared permissions and expected app functionality, helping developers and security reviewers catch suspicious behavior before the app reaches production.
          </p>
          <div className="rounded-lg border bg-muted/30 p-4 my-4">
            <p className="text-sm font-mono text-xs break-all">
              &lt;uses-permission android:name="android.permission.CAMERA" /&gt;
            </p>
            <p className="text-sm font-mono text-xs break-all mt-1">
              &lt;uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" /&gt;
            </p>
            <p className="text-sm font-mono text-xs break-all mt-1">
              &lt;uses-permission android:name="android.permission.READ_CONTACTS" /&gt;
            </p>
            <p className="text-sm font-mono text-xs break-all mt-1">
              &lt;uses-permission android:name="android.permission.RECORD_AUDIO" /&gt;
            </p>
            <p className="text-sm font-mono text-xs break-all mt-1">
              &lt;uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" /&gt;
            </p>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Pulse AI also checks whether the app is configured with <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">android:allowBackup="true"</code> (which could expose app data through adb backup), whether it is marked as debuggable in production builds, and whether it has any exported components that are not properly protected by permission requirements. These manifest-level issues are often overlooked during development but can have serious security implications when the app is deployed to production.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">Tracker and SDK Detection</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            After analyzing the manifest, Pulse AI scans the DEX bytecode of the APK to identify embedded trackers, analytics SDKs, advertising networks, and social media integrations. This is done by matching package names, class signatures, and known binary patterns against a comprehensive database of over 300 mobile trackers and SDKs. The scan covers categories including analytics providers (Google Analytics, Firebase Analytics, Mixpanel, Amplitude), advertising networks (Google Ads, Facebook Audience Network, Unity Ads), social SDKs (Facebook, Twitter, WhatsApp), crash reporting tools (Crashlytics, Bugsnag, Sentry), and performance monitoring libraries.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Each detected tracker is categorized and risk-rated based on its data collection behavior. Analytics SDKs that collect device identifiers, advertising SDKs that build user profiles across apps, and social SDKs that share data with third-party networks are flagged as higher-risk than benign utility libraries. Pulse AI provides a complete inventory of every SDK and tracker found in the APK, along with a summary of what data each one is known to collect. This is invaluable for privacy compliance reviews, app store disclosure requirements, and internal security audits. Many developers are surprised to discover that their app includes trackers they did not intentionally add, introduced transitively through third-party dependencies.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The tracker detection goes beyond simple package name matching. Pulse AI also identifies tracker-like behavior in obfuscated code, such as classes that access advertising identifiers, collect device fingerprints, or transmit data to known tracking endpoints. This behavioral analysis catches trackers that have been renamed or obfuscated to evade detection by simpler scanning tools. The result is a comprehensive map of every data-collecting component in your APK, giving you full visibility into what your app is doing behind the scenes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">Hardcoded Secrets</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            One of the most common and dangerous security mistakes in Android development is hardcoding secrets — API keys, authentication tokens, database credentials, encryption keys, and other sensitive values — directly in the source code or compiled DEX bytecode. Pulse AI performs exhaustive pattern scanning across all DEX files, native libraries, and resource files in the APK to detect these hardcoded secrets. The scanner looks for patterns including AWS access keys, Google API keys, Firebase configuration values, Stripe keys, database connection strings, JWT signing secrets, and custom patterns that match common key-value formats.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The tooling for extracting hardcoded secrets from APKs is well-established in the security community. Using tools like <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">apktool</code> to decompile resources and <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">jadx</code> to decompile Java bytecode, an attacker can reconstruct a readable approximation of the app's source code and search for sensitive values. Even if the code is obfuscated with ProGuard or R8, string constants — including API keys and tokens — are typically preserved in the compiled output because they are needed at runtime. Pulse AI replicates this extraction process in a controlled, automated manner, identifying secrets before attackers have the chance.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            When Pulse AI detects a hardcoded secret, the severity of the finding depends on the type of secret and its potential impact. A Google Maps API key with unrestricted API access is flagged as a high-severity finding because it could be extracted and abused for unauthorized usage, potentially costing the developer money and exposing their API quota. A Firebase configuration object is flagged as medium severity because it reveals the project configuration, though Firebase security rules should ideally protect the backend regardless of key exposure. The audit report includes the specific secret type detected, the file and approximate location where it was found, and a recommendation for securely managing that secret using environment variables, a secrets manager, or a backend proxy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">Certificate and Network Security</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The final layer of APK security analysis in Pulse AI covers certificate verification and network security configuration. Pulse AI extracts and analyzes the APK's signing certificate to verify that it uses a valid certificate chain, that the certificate has not expired, and that the signing key strength meets current security standards. Weak signing algorithms (such as MD5withRSA) or expired certificates are flagged as security risks that could indicate a compromised build process or an outdated development pipeline.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Pulse AI also checks whether the app is configured to allow cleartext (unencrypted HTTP) traffic, which is a significant security vulnerability on modern networks. Apps that set <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">android:usesCleartextTraffic="true"</code> or include no <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">networkSecurityConfig</code> are susceptible to man-in-the-middle attacks, credential interception, and data tampering on any network where the attacker can position themselves between the device and the server. Additionally, Pulse AI checks for certificate pinning, which binds the app to specific server certificates and prevents an attacker from using a fraudulent certificate to intercept HTTPS traffic. Apps that handle sensitive data — financial information, authentication tokens, personal health records — should implement certificate pinning as a defense-in-depth measure.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The network security analysis also covers whether the app uses the Android Network Security Configuration file to define custom trust anchors, cleartext traffic exceptions, and certificate pinning rules. A well-configured network security config is one of the most effective ways to secure network communications in an Android app, and Pulse AI checks for its presence and correctness as part of every APK audit.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">Try It Yourself</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            APK security analysis is one of those tasks that is easy to skip during development but can have severe consequences in production. Hardcoded secrets in a released APK can be extracted within minutes by anyone who downloads the app. Missing permission reviews can lead to privacy violations and regulatory fines. Undetected trackers can expose your users to data collection they never consented to. Pulse AI automates all of these checks and more, giving you a comprehensive security report for any APK in under 60 seconds.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Upload any APK to Pulse AI and get a full security report covering permissions, trackers, hardcoded secrets, certificate analysis, and network security configuration. The report includes an AI-generated summary that explains each finding in plain English and provides specific remediation steps. Whether you are a developer reviewing your own app or a security auditor evaluating a third-party APK, Pulse AI gives you the visibility you need to identify and fix security issues before they become incidents. Try uploading an APK today and see what your app reveals.
          </p>
        </section>
      </div>
    ),
  },
};

export function BlogPostView() {
  const { navigate, selectedProjectId } = useAppStore();
  const slug = selectedProjectId || '0';
  const article = blogArticles[slug];

  const otherArticles = Object.entries(blogArticles)
    .filter(([key]) => key !== slug)
    .map(([key, value]) => ({ key, ...value }));

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
          <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 h-14">
            <button onClick={() => navigate('landing')} className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                <HeartPulse className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-bold tracking-tight">Pulse AI</span>
            </button>
            <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              <span className="text-muted-foreground">Blog</span>
            </nav>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-sm" onClick={() => navigate('landing')}>
                Home
              </Button>
              <Button size="sm" className="text-sm" onClick={() => navigate('landing')}>
                Get Started
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">Article not found</h1>
            <p className="text-muted-foreground max-w-md">
              The article you are looking for does not exist or has been removed. Browse our other articles or return to the homepage.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" onClick={() => navigate('landing')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
              <Button onClick={() => navigate('blog', '0')}>View Blog</Button>
            </div>
          </div>
        </main>

        <footer className="border-t py-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <button onClick={() => navigate('landing')} className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
                  <HeartPulse className="h-3 w-3 text-primary-foreground" />
                </div>
                <span className="font-semibold text-sm">Pulse AI</span>
              </button>
              <nav className="flex items-center gap-5 text-xs text-muted-foreground">
                <button onClick={() => navigate('blog', '0')} className="hover:text-foreground transition-colors">Blog</button>
                <button onClick={() => navigate('privacy')} className="hover:text-foreground transition-colors">Privacy</button>
                <button onClick={() => navigate('terms')} className="hover:text-foreground transition-colors">Terms</button>
                <button onClick={() => navigate('auth')} className="hover:text-foreground transition-colors">Sign in</button>
              </nav>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  const ctaTarget = slug === '2' ? 'auth' as const : 'landing' as const;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 h-14">
          <button onClick={() => navigate('landing')} className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <HeartPulse className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold tracking-tight">Pulse AI</span>
          </button>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <span className="text-muted-foreground">Blog</span>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-sm" onClick={() => navigate('landing')}>
              Home
            </Button>
            <Button size="sm" className="text-sm" onClick={() => navigate(ctaTarget)}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* BACK LINK */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-8">
          <button
            onClick={() => navigate('blog', '0')}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            All articles
          </button>
        </div>

        {/* ARTICLE HEADER */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Badge variant="secondary" className="text-xs">
              {article.category}
            </Badge>
            <span>{article.date}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {article.readTime}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.2]">
            {article.title}
          </h1>

          {/* HERO IMAGE */}
          <div className="mt-8 rounded-xl overflow-hidden border bg-muted">
            <Image
              src={article.image}
              alt={article.title}
              width={900}
              height={500}
              className="w-full h-auto object-cover"
              priority
            />
          </div>
        </div>

        {/* ARTICLE CONTENT */}
        <article className="mx-auto max-w-3xl px-4 sm:px-6 pb-12">
          <div className="prose-custom text-sm leading-relaxed">
            {article.content}
          </div>
        </article>

        {/* BOTTOM CTA */}
        <section className="border-t py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Stop guessing. Start measuring.
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Run a free product health audit and get an AI-written action plan in seconds. Websites and Android APKs supported.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button onClick={() => navigate(ctaTarget)}>
                  Get Started Free <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* MORE FROM THE BLOG */}
        <section className="border-t py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-8">More from the blog</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {otherArticles.map((post) => (
                <Card
                  key={post.key}
                  className="group cursor-pointer overflow-hidden hover:shadow-md transition-shadow duration-200"
                  onClick={() => navigate('blog', post.key)}
                >
                  <div className="aspect-[16/10] overflow-hidden bg-muted">
                    <Image
                      src={post.image}
                      alt={post.title}
                      width={600}
                      height={375}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-5 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {post.category}
                      </Badge>
                      <span>{post.date}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <button onClick={() => navigate('landing')} className="flex items-center gap-2 mb-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
                  <HeartPulse className="h-3 w-3 text-primary-foreground" />
                </div>
                <span className="font-semibold text-sm">Pulse AI</span>
              </button>
              <p className="text-xs text-muted-foreground leading-relaxed">
                AI-powered website audit tool and Android APK scanner. Get product health scores, security reports, and AI-written action plans.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Product</h4>
              <nav className="flex flex-col gap-2">
                <button onClick={() => navigate('landing')} className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left">Features</button>
                <button onClick={() => navigate('auth')} className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left">Get Started</button>
                <button onClick={() => navigate('blog', '0')} className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left">Blog</button>
              </nav>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Resources</h4>
              <nav className="flex flex-col gap-2">
                <button onClick={() => navigate('blog', '0')} className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left">Why Lighthouse Scores Lie</button>
                <button onClick={() => navigate('blog', '1')} className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left">Security Headers Guide</button>
                <button onClick={() => navigate('blog', '2')} className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left">APK Security Analysis</button>
              </nav>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Legal</h4>
              <nav className="flex flex-col gap-2">
                <button onClick={() => navigate('privacy')} className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left">Privacy Policy</button>
                <button onClick={() => navigate('terms')} className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left">Terms &amp; Conditions</button>
              </nav>
            </div>
          </div>
          <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Pulse AI. AI-powered product intelligence platform.
            </p>
            <nav className="flex items-center gap-5 text-xs text-muted-foreground">
              <button onClick={() => navigate('landing')} className="hover:text-foreground transition-colors">Features</button>
              <button onClick={() => navigate('privacy')} className="hover:text-foreground transition-colors">Privacy</button>
              <button onClick={() => navigate('terms')} className="hover:text-foreground transition-colors">Terms</button>
              <button onClick={() => navigate('auth')} className="hover:text-foreground transition-colors">Sign in</button>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
