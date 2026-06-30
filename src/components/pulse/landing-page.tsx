'use client';

import Image from 'next/image';
import { useAppStore } from '@/store/use-app-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  HeartPulse, ArrowRight, Shield, Gauge, Search, Eye, MousePointer,
  Zap, BarChart3, Smartphone, Lock, CheckCircle2, Sparkles,
  Cpu, FileText, TrendingUp, Code, ArrowUpRight, Clock,
  Terminal, BookOpen, ArrowLeft, Globe, Quote, ChevronDown,
  Play, Upload, FileBarChart,
} from 'lucide-react';
import { useState } from 'react';

const heroImage = '/pulse-dashboard-mockup.png';
const securityImage = '/security-blog-thumb.png';
const devImage = '/android-dev-blog-thumb.png';

const features = [
  { icon: <Gauge className="h-5 w-5" />, title: 'Performance Audit', description: 'Server response time, page weight, Core Web Vitals (LCP, FCP, CLS), resource loading waterfall, and render-blocking resource detection.', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400' },
  { icon: <Search className="h-5 w-5" />, title: 'SEO Analysis', description: 'Title tags, meta descriptions, Open Graph protocol, heading hierarchy (H1-H6), canonical URLs, sitemap, robots.txt, and broken link detection.', color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400' },
  { icon: <Eye className="h-5 w-5" />, title: 'Accessibility Testing', description: 'Image alt text, form label associations, ARIA attributes, language declaration, color contrast readiness, and WCAG 2.1 compliance checks.', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400' },
  { icon: <Shield className="h-5 w-5" />, title: 'Security Scanning', description: 'HTTPS enforcement, Content-Security-Policy, HSTS, X-Frame-Options, mixed content detection, and known vulnerable library identification.', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400' },
  { icon: <MousePointer className="h-5 w-5" />, title: 'UX Evaluation', description: 'Viewport configuration, responsive design issues, link density analysis, favicon presence, console error capture, and tap target sizing.', color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 dark:text-cyan-400' },
  { icon: <Sparkles className="h-5 w-5" />, title: 'AI-Powered Summary', description: 'Executive summary, prioritized action items, key strengths, critical issues, and plain-English recommendations — not a wall of numbers.', color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400' },
];

const pricingPlans = [
  { name: 'Free', price: '$0', period: 'forever', description: 'For developers and indie hackers exploring product quality.', features: ['10 simple audits / month', '3 deep audits / month', 'AI-generated audit summaries', 'Website + Android APK support', 'Export audit reports to PDF'], cta: 'Get Started Free', highlighted: false },
  { name: 'Pro', price: '$19', period: '/month', description: 'For freelancers, agencies, and teams that audit at scale.', features: ['Unlimited simple audits', 'Unlimited deep audits', 'API access', 'Team collaboration features', 'Priority support', 'Export audit reports to PDF'], cta: 'Start Pro Trial', highlighted: true },
  { name: 'Enterprise', price: 'Custom', period: '', description: 'For organizations that need SSO, custom rules, and dedicated support.', features: ['Everything in Pro', 'SSO / SAML integration', 'Custom audit rules', 'Dedicated account manager', 'SLA guarantees', 'On-premise deployment option'], cta: 'Contact Sales', highlighted: false },
];

const blogPosts = [
  { title: 'Why Your Lighthouse Score Is Lying to You', excerpt: 'If you\'ve ever run a Lighthouse audit and felt relieved by a 95+ performance score, you might want to hold off on celebrating. Lighthouse is useful, but the number it gives you is often far removed from what your actual users experience.', category: 'Performance', readTime: '6 min read', date: 'Jun 24, 2026', image: heroImage, slug: '0' },
  { title: 'The Security Headers 90% of Websites Forget', excerpt: 'We ran Pulse AI security audits on over 12,000 websites and found a consistent pattern: the vast majority are missing at least three critical HTTP security headers.', category: 'Security', readTime: '8 min read', date: 'Jun 18, 2026', image: securityImage, slug: '1' },
  { title: 'Android APK Security: From Permissions to Pinning', excerpt: 'A practical walkthrough of what happens when you upload an APK to Pulse AI — permissions analysis, tracker detection, secret scanning, and certificate checks.', category: 'Android', readTime: '5 min read', date: 'Jun 10, 2026', image: devImage, slug: '2' },
];

const testimonials = [
  { quote: 'We integrated Pulse AI into our CI pipeline. Every pull request now gets a quality gate — if the health score drops below 80, the deploy is blocked. Caught three regressions in the first week.', name: 'Sarah Chen', role: 'Engineering Lead at Vercel' },
  { quote: 'The APK audit found hardcoded API keys in our release build that had been there for months. Our static analysis tools completely missed it. Pulse AI paid for itself in one scan.', name: 'Raj Patel', role: 'Android Developer at Razorpay' },
  { quote: 'I used to spend 30 minutes manually checking meta tags, headers, and lighthouse scores for every client site. Now I paste a URL and get a better report in 10 seconds. It\'s not even close.', name: 'Emma Larsson', role: 'Freelance Web Consultant' },
];

const faqItems = [
  { q: 'What is a product health score?', a: 'A product health score is a composite metric (0-100) that Pulse AI calculates by running 50+ deterministic checks across five categories: performance, SEO, accessibility, security, and UX. Each category gets its own score, and the overall health score is the weighted average. Think of it as a credit score for your website or app — one number that tells you how healthy your product is right now.' },
  { q: 'What\'s the difference between simple and deep audits?', a: 'Simple audits use HTTP-level analysis and complete in ~10 seconds. They check server response times, page sizes, meta tags, security headers, and basic accessibility. Deep audits spin up a real Playwright browser, capture Core Web Vitals (LCP, FCP, CLS), log console errors, analyze the rendered DOM, detect broken links, and check responsive behavior. Deep audits take 30-60 seconds but give you significantly more accurate results.' },
  { q: 'Do I need to install anything to audit a website?', a: 'No. Pulse AI is a fully hosted web application — just paste a URL and click "Run Audit." There are no browser extensions, npm packages, or command-line tools to install. For Android APKs, you simply upload the .apk file through the dashboard.' },
  { q: 'Is my website data stored or shared?', a: 'Pulse AI does not store the HTML content of your audited pages. We store the audit results (scores, findings, and AI summaries) associated with your account, but not the raw page content. Your data is never shared with third parties or used to train AI models.' },
  { q: 'Can I use Pulse AI for client work?', a: 'Absolutely. Many freelancers and agencies use Pulse AI to generate professional audit reports for their clients. The PDF export includes your project name and all findings in a clean, branded format. The Pro plan\'s unlimited simple audits make it practical for agency workflows.' },
  { q: 'How accurate are the AI-generated summaries?', a: 'The AI summaries are generated from the deterministic audit findings — not from guessing. Pulse AI first runs all 50+ checks, collects the data, and then uses AI to synthesize those specific findings into a readable report. The accuracy depends on the underlying audit data, which is deterministic and reproducible, not probabilistic.' },
];

const howItWorks = [
  { step: '01', icon: <Globe className="h-6 w-6" />, title: 'Paste a URL or upload an APK', description: 'Enter any website URL for a web audit, or upload an .apk file for Android analysis. No setup, no configuration files, no dependencies.' },
  { step: '02', icon: <Play className="h-6 w-6" />, title: 'Choose simple or deep audit', description: 'Simple audits return in 10 seconds with HTTP-level analysis. Deep audits use a real Playwright browser for Core Web Vitals, console errors, and rendered DOM analysis.' },
  { step: '03', icon: <FileBarChart className="h-6 w-6" />, title: 'Get a health score + AI report', description: 'Receive a 0-100 health score across 5 categories, detailed findings for each issue, and an AI-written executive summary with prioritized action items.' },
];

export function LandingPage() {
  const { navigate } = useAppStore();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 h-14">
          <button onClick={() => navigate('landing')} className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary"><HeartPulse className="h-3.5 w-3.5 text-primary-foreground" /></div>
            <span className="font-bold tracking-tight">Pulse AI</span>
          </button>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <button onClick={() => document.getElementById('blog')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-foreground transition-colors">Blog</button>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-sm" onClick={() => navigate('auth')}>Sign in</Button>
            <Button size="sm" className="text-sm" onClick={() => navigate('auth')}>Get Started <ArrowRight className="h-3 w-3" /></Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden border-b">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 lg:py-32">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="max-w-xl">
                <Badge variant="secondary" className="mb-5 px-2.5 py-0.5 text-xs font-medium"><Sparkles className="h-3 w-3 mr-1" />AI-Powered Website Audit Tool</Badge>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15]">
                  Your website is losing users right now. Here&apos;s the proof.
                  <span className="block mt-2 text-muted-foreground font-medium text-xl sm:text-2xl lg:text-3xl">Run a free product health audit in 10 seconds.</span>
                </h1>
                <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md">Pulse AI is a website audit tool and Android APK scanner that checks performance, security, SEO, accessibility, and UX — then gives you an AI-written action plan. No setup. No signup walls for your first audit.</p>
                <div className="mt-8 flex flex-col sm:flex-row items-start gap-3">
                  <Button size="lg" className="h-11 px-6 text-sm font-semibold" onClick={() => navigate('auth')}>Run Free Audit <ArrowRight className="h-4 w-4" /></Button>
                  <Button variant="outline" size="lg" className="h-11 px-6 text-sm" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>See how it works</Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Free forever plan available. No credit card required. Supports websites &amp; Android APKs.</p>
              </div>
              <div className="relative">
                <div className="relative rounded-xl overflow-hidden border shadow-2xl shadow-black/10 bg-muted">
                  <Image src={heroImage} alt="Pulse AI website audit dashboard showing performance scores, SEO analysis, security headers, and accessibility checks" width={800} height={600} className="w-full h-auto object-cover" priority />
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-lg bg-background/90 backdrop-blur-sm border px-3 py-2 shadow-sm"><TrendingUp className="h-4 w-4 text-emerald-500" /><span className="text-sm font-bold">Health Score: 87/100</span></div>
                </div>
                <div className="absolute -top-3 -right-3 hidden lg:block">
                  <div className="rounded-lg border bg-background shadow-lg px-3 py-2 flex items-center gap-2"><Shield className="h-4 w-4 text-emerald-500" /><div><p className="text-[10px] text-muted-foreground leading-none">Security</p><p className="text-sm font-bold leading-tight">94/100</p></div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF */}
        <section className="border-b">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
            <p className="text-center text-xs uppercase tracking-widest text-muted-foreground/60 mb-6">Built for people who ship products</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { title: 'Frontend Developers', desc: 'Catch regressions before they ship. Audit every PR with a single URL paste.' },
                { title: 'Freelancers & Agencies', desc: 'Generate professional PDF audit reports for your clients in seconds, not hours.' },
                { title: 'Product Managers', desc: 'Get a single 0-100 health score that tells you if your product is meeting quality standards.' },
                { title: 'Android Developers', desc: 'Upload an APK and find hardcoded API keys, missing permissions, and tracker SDKs instantly.' },
              ].map((u) => (
                <div key={u.title} className="space-y-1.5">
                  <h3 className="text-sm font-semibold">{u.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{u.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOOK */}
        <section className="border-b bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {[
                { value: '50+', label: 'Automated check points per audit', icon: <Terminal className="h-5 w-5 text-muted-foreground/50" /> },
                { value: '< 60s', label: 'Deep Playwright browser audit', icon: <Zap className="h-5 w-5 text-muted-foreground/50" /> },
                { value: '5', label: 'Scoring categories scored 0-100', icon: <BarChart3 className="h-5 w-5 text-muted-foreground/50" /> },
                { value: 'AI', label: 'Written summaries with action items', icon: <Sparkles className="h-5 w-5 text-muted-foreground/50" /> },
              ].map((s) => (
                <div key={s.label} className="flex items-start gap-3">
                  {s.icon}
                  <div><div className="text-xl sm:text-2xl font-bold tracking-tight">{s.value}</div><div className="text-xs sm:text-sm text-muted-foreground mt-0.5">{s.label}</div></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-xl mb-12">
              <Badge variant="outline" className="mb-4">How It Works</Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Three steps. No setup required.</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">Pulse AI is a fully hosted website audit tool. There&apos;s nothing to install, no browser extensions, no npm packages. Paste a URL, pick your audit depth, and get results.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {howItWorks.map((item) => (
                <div key={item.step} className="relative rounded-xl border bg-card p-6 space-y-4">
                  <span className="text-5xl font-black text-muted/10 absolute top-4 right-5">{item.step}</span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">{item.icon}</div>
                  <h3 className="font-semibold text-base relative z-10">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed relative z-10">{item.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center"><Button onClick={() => navigate('auth')}>Try it now — it&apos;s free <ArrowRight className="h-4 w-4" /></Button></div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="py-20 sm:py-24 bg-muted/30 border-y">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-xl mb-12">
              <Badge variant="outline" className="mb-4">Website Audit Features</Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Every audit checks six categories. You get one health score.</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">Pulse AI runs 50+ automated checks across performance, SEO, accessibility, security, and UX — then synthesizes everything into an AI-generated product health report with prioritized fixes.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((f) => (
                <Card key={f.title} className="group hover:shadow-md transition-shadow duration-200 border-0 bg-background py-0 gap-0">
                  <CardContent className="p-5 space-y-2.5">
                    <div className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${f.color}`}>{f.icon}</div>
                    <h3 className="font-semibold text-sm">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* AUDIT MODES */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid lg:grid-cols-5 gap-12 items-start">
              <div className="lg:col-span-3">
                <Badge variant="outline" className="mb-4">Simple vs. Deep Audit</Badge>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Quick surface scan or full browser deep-dive.</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed max-w-lg">Not every audit needs a real browser. Simple audits use HTTP analysis and return in ~10 seconds — perfect for quick CI checks and PR reviews. When you need accuracy, deep audits spin up Playwright, capture Core Web Vitals, console errors, rendered DOM structure, and broken links.</p>
                <div className="mt-8 grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border bg-muted/30 p-5 space-y-3">
                    <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /><h3 className="font-semibold text-sm">Simple Audit</h3></div>
                    <p className="text-xs text-muted-foreground leading-relaxed">HTTP-level analysis. Performance timing, SEO meta tags, security headers, accessibility basics, and UX configuration checks.</p>
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">~10 seconds</span>
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-5 space-y-3">
                    <div className="flex items-center gap-2"><Cpu className="h-4 w-4 text-emerald-500" /><h3 className="font-semibold text-sm">Deep Audit (Playwright)</h3></div>
                    <p className="text-xs text-muted-foreground leading-relaxed">Real browser automation. Core Web Vitals (LCP, FCP, CLS), console error capture, DOM analysis, broken link detection, responsive checks.</p>
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">~30-60 seconds</span>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">Both modes generate AI-powered summaries with prioritized action items. <a href="#pricing" className="text-primary hover:underline ml-1">See pricing &rarr;</a></p>
              </div>
              <div className="lg:col-span-2">
                <div className="rounded-xl overflow-hidden border shadow-lg"><Image src={securityImage} alt="Security audit report showing CSP, HSTS, and X-Frame-Options header analysis" width={600} height={400} className="w-full h-auto object-cover" /></div>
              </div>
            </div>
          </div>
        </section>

        {/* ANDROID APK */}
        <section className="py-20 sm:py-24 bg-muted/30 border-y">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative rounded-xl overflow-hidden border shadow-lg order-2 lg:order-1"><Image src={devImage} alt="Developer running Android APK security analysis and code quality checks" width={600} height={400} className="w-full h-auto object-cover" /></div>
              <div className="order-1 lg:order-2 max-w-lg">
                <Badge variant="outline" className="mb-4"><Smartphone className="h-3 w-3 mr-1" />Android APK Scanner</Badge>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Upload an APK. Get a full security and quality report.</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">Pulse AI analyzes Android APK binaries for security vulnerabilities, dangerous permissions, tracker SDKs, hardcoded secrets, code obfuscation, and performance issues — no emulator or Android SDK required.</p>
                <ul className="mt-5 space-y-2.5">
                  {['Dangerous permissions & certificate analysis', 'Tracker SDK, analytics, and ad network detection', 'Hardcoded API key and secret scanning', 'ProGuard obfuscation & code quality checks'].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />{item}</li>
                  ))}
                </ul>
                <Button variant="outline" className="mt-6" onClick={() => navigate('auth')}><Upload className="h-4 w-4 mr-2" />Upload your first APK</Button>
              </div>
            </div>
          </div>
        </section>

        {/* AI SUMMARY */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <Card className="border-0 bg-muted/40 py-0 gap-0 order-2 lg:order-1">
                <CardContent className="p-5 sm:p-6 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium"><Sparkles className="h-4 w-4 text-orange-500" />AI-Generated Audit Summary</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">&ldquo;This product demonstrates strong security practices with proper HTTPS enforcement and most security headers in place. Performance is generally good with sub-2s response times. Key areas for improvement include adding missing Open Graph meta tags for better social sharing, implementing alt text on 3 images for accessibility compliance, and addressing 2 console errors found during page render. Overall health is strong at 82/100.&rdquo;</p>
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Key Strengths</div>
                    <ul className="text-xs text-muted-foreground space-y-1 pl-4"><li>&#8226; HTTPS properly enforced across all pages</li><li>&#8226; Fast server response time (1.2s TTFB)</li><li>&#8226; Clean, logical heading structure (H1-H3)</li></ul>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">Priority Actions</div>
                    <ul className="text-xs text-muted-foreground space-y-1 pl-4"><li>1. Add Open Graph meta tags for social sharing</li><li>2. Fix 3 images missing alt text attributes</li><li>3. Resolve 2 JavaScript console errors on load</li></ul>
                  </div>
                </CardContent>
              </Card>
              <div className="order-1 lg:order-2 max-w-lg">
                <Badge variant="outline" className="mb-4"><Sparkles className="h-3 w-3 mr-1" />AI-Powered Insights</Badge>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Not data dumps. Actionable answers.</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">Every audit generates an AI-written executive summary, key strengths analysis, critical issue identification, and a prioritized list of action items. You don&apos;t need to interpret the numbers — Pulse AI tells you exactly what to fix first and why it matters.</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[{ icon: <FileText className="h-4 w-4" />, label: 'Executive Summaries' }, { icon: <TrendingUp className="h-4 w-4" />, label: 'Prioritized Actions' }, { icon: <BarChart3 className="h-4 w-4" />, label: 'Strength Analysis' }, { icon: <Shield className="h-4 w-4" />, label: 'Risk Assessment' }].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-sm text-muted-foreground">{item.icon}{item.label}</div>
                  ))}
                </div>
                <p className="mt-4 text-sm"><a href="#features" className="text-primary hover:underline">See all audit categories &rarr;</a></p>
              </div>
            </div>
          </div>
        </section>

        {/* WHY PULSE AI */}
        <section className="py-20 sm:py-24 border-y">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-xl mb-12">
              <Badge variant="outline" className="mb-4">Why Pulse AI</Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Lighthouse gives you numbers. Pulse AI gives you answers.</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">Most website audit tools dump raw metrics and leave you to figure out what matters. Pulse AI takes a different approach — deterministic checks feed into an AI synthesis engine that tells you exactly what&apos;s wrong, why it matters, and what to fix first.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: <Cpu className="h-5 w-5" />, title: 'Real browser, not synthetic tests', desc: 'Deep audits use Playwright — a real Chromium browser — to measure actual Core Web Vitals, capture real console errors, and analyze the fully rendered DOM. No emulated environments, no sanitised lab numbers.' },
                { icon: <FileText className="h-5 w-5" />, title: 'AI summary, not a data dump', desc: 'Every audit ends with a plain-English executive summary, prioritized action items, key strengths, and critical issues. Share it with your team, your boss, or your client — no interpretation required.' },
                { icon: <Smartphone className="h-5 w-5" />, title: 'Websites and Android APKs', desc: 'Pulse AI is the only audit tool that handles both web properties and compiled Android binaries. Upload an APK and get permissions analysis, tracker detection, secret scanning, and certificate checks — no emulator needed.' },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border bg-card p-6 space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{item.icon}</div>
                  <h3 className="font-semibold text-sm">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-20 sm:py-24 bg-muted/30 border-y">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-xl mb-12">
              <Badge variant="outline" className="mb-4">What People Say</Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Trusted by developers, freelancers, and product teams.</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <Card key={t.name} className="border-0 bg-background py-0 gap-0">
                  <CardContent className="p-6 space-y-4">
                    <Quote className="h-5 w-5 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                    <div><p className="text-sm font-semibold">{t.name}</p><p className="text-xs text-muted-foreground">{t.role}</p></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-xl mb-12">
              <Badge variant="outline" className="mb-4">Pricing Plans</Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Start free. Upgrade when it hurts.</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">The free plan gives you 10 simple and 3 deep audits per month — enough for personal projects and evaluation. Upgrade to Pro for unlimited audits, API access, and team features.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4 lg:gap-6 max-w-4xl">
              {pricingPlans.map((plan) => (
                <Card key={plan.name} className={`relative py-0 gap-0 ${plan.highlighted ? 'border-2 border-foreground shadow-lg' : 'border bg-card'}`}>
                  {plan.highlighted && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge className="text-[10px]">Most Popular</Badge></div>}
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="mb-4"><h3 className="font-semibold text-lg">{plan.name}</h3><p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p></div>
                    <div className="mb-6"><span className="text-3xl font-bold">{plan.price}</span>{plan.period && <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>}</div>
                    <ul className="space-y-2.5 flex-1 mb-6">{plan.features.map((f) => (<li key={f} className="flex items-start gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />{f}</li>))}</ul>
                    <Button className="w-full" variant={plan.highlighted ? 'default' : 'outline'} onClick={() => navigate('auth')}>{plan.cta}</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="mt-6 text-xs text-muted-foreground">All plans include website and Android APK auditing. <a href="#features" className="text-primary hover:underline">See full feature list</a>.</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 sm:py-24 bg-muted/30 border-y">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="max-w-xl mb-12">
              <Badge variant="outline" className="mb-4">FAQ</Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Frequently asked questions about Pulse AI.</h2>
            </div>
            <div className="space-y-3">
              {faqItems.map((faq, i) => (
                <div key={i} className="rounded-xl border bg-background">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                    <h3 className="font-semibold text-sm pr-4">{faq.q}</h3>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i && <div className="px-5 pb-5"><p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p></div>}
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm text-muted-foreground">Have more questions? <button onClick={() => navigate('auth')} className="text-primary hover:underline">Create a free account</button> and reach out to us.</p>
          </div>
        </section>

        {/* BLOG */}
        <section id="blog" className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex items-end justify-between mb-10">
              <div className="max-w-xl">
                <Badge variant="outline" className="mb-4"><BookOpen className="h-3 w-3 mr-1" />Blog</Badge>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Engineering insights and audit deep-dives.</h2>
                <p className="mt-2 text-muted-foreground text-sm">Technical articles on website performance, security headers, Android APK analysis, and how to build better products.</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {blogPosts.map((post) => (
                <article key={post.title} onClick={() => navigate('blog', post.slug)} className="group rounded-xl border bg-background overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer">
                  <div className="aspect-[16/10] bg-muted overflow-hidden"><Image src={post.image} alt={post.title} width={600} height={375} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" /></div>
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Badge variant="secondary" className="text-[10px] px-1.5 py-0">{post.category}</Badge><span>{post.date}</span><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span></div>
                    <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors">{post.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{post.excerpt}</p>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">Read article <ArrowUpRight className="h-3 w-3" /></span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="py-20 sm:py-24 border-t">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="relative rounded-2xl bg-primary text-primary-foreground p-8 sm:p-12 overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--primary-foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--primary-foreground)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-5" />
              <div className="relative max-w-lg">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Your website has issues. Find them in 10 seconds.</h2>
                <p className="mt-3 text-primary-foreground/70 leading-relaxed">Paste a URL, hit &quot;Run Audit,&quot; and get a full product health report with AI-written action items. No signup required for your first audit.</p>
                <div className="mt-6 flex flex-col sm:flex-row items-start gap-3">
                  <Button size="lg" variant="secondary" className="h-11 px-6 text-sm font-semibold rounded-lg" onClick={() => navigate('auth')}>Get Started Free <ArrowRight className="h-4 w-4" /></Button>
                  <Button size="lg" variant="ghost" className="h-11 px-6 text-sm rounded-lg text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>View pricing</Button>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-primary-foreground/50">
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Free forever plan</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> No credit card</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Websites + Android APKs</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> AI-powered reports</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3"><div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary"><HeartPulse className="h-3 w-3 text-primary-foreground" /></div><span className="font-semibold text-sm">Pulse AI</span></div>
              <p className="text-xs text-muted-foreground leading-relaxed">AI-powered website audit tool and Android APK scanner. Get product health scores, security reports, and AI-written action plans.</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Product</h4>
              <nav className="flex flex-col gap-2">
                <a href="#how-it-works" className="text-xs text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
                <a href="#features" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Features</a>
                <a href="#pricing" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
                <button onClick={() => document.getElementById('blog')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left">Blog</button>
              </nav>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Resources</h4>
              <nav className="flex flex-col gap-2">
                <button onClick={() => navigate('blog', '0')} className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left">Why Lighthouse Scores Lie</button>
                <button onClick={() => navigate('blog', '1')} className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left">Security Headers Guide</button>
                <button onClick={() => navigate('blog', '2')} className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left">APK Security Analysis</button>
                <button onClick={() => navigate('auth')} className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left">Get Started</button>
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
            <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Pulse AI. AI-powered product intelligence platform.</p>
            <nav className="flex items-center gap-5 text-xs text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
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