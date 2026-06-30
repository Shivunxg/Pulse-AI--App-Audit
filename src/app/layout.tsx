import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pulse AI — Free Website Audit Tool & Android APK Scanner",
  description: "Run a free website audit in 10 seconds. Pulse AI checks performance, security, SEO, accessibility, and UX — then generates an AI-powered product health report with prioritized action items. Also supports Android APK security scanning.",
  keywords: "website audit tool, product health score, SEO checker, security header scanner, website performance test, accessibility checker, Android APK scanner, Core Web Vitals, Lighthouse alternative, AI audit report, free website audit, APK security analysis, website health check",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Pulse AI — Free Website Audit Tool & Android APK Scanner",
    description: "Run a free website audit in 10 seconds. Check performance, security, SEO, accessibility, and UX with AI-powered health scores and action plans.",
    type: "website",
    siteName: "Pulse AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pulse AI — Free Website Audit Tool & Android APK Scanner",
    description: "Run a free website audit in 10 seconds. 50+ automated checks, AI-powered summaries, and Android APK scanning.",
  },
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Pulse AI",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Web",
    "description": "AI-powered website audit tool and Android APK scanner. Get product health scores, security reports, and AI-written action plans.",
    "offers": [
      { "@type": "Offer", "price": "0", "priceCurrency": "USD", "name": "Free Plan", "description": "10 simple audits/month, 3 deep audits/month, AI summaries, PDF export" },
      { "@type": "Offer", "price": "19", "priceCurrency": "USD", "billingIncrement": "P1M", "name": "Pro Plan", "description": "Unlimited audits, API access, team features" }
    ],
    "featureList": "Website audit, Android APK scanner, Performance, SEO, Accessibility, Security, UX, AI summaries, Core Web Vitals, PDF export"
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}