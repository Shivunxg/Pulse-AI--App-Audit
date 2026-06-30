'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, X, Zap, Building2, User, Loader2, Settings } from 'lucide-react';

interface UsageData {
  tier: string;
  tierName: string;
  auditsUsed: number;
  auditsLimit: number;
  daysUntilReset: number;
}

type Currency = 'usd' | 'inr';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    icon: <User className="h-5 w-5" />,
    priceUsd: 0,
    priceInr: 0,
    tagline: 'Get started with basic audits',
    features: [
      { label: '5 audits per month', included: true },
      { label: 'Simple audit (HTTP-based)', included: true },
      { label: 'Performance, SEO, Accessibility, Security, UX', included: true },
      { label: 'Deep Audit (Playwright + Core Web Vitals)', included: false },
      { label: 'Technology + Content audit', included: false },
      { label: 'AI-powered executive summary', included: false },
      { label: 'PDF export', included: false },
      { label: 'axe-core WCAG 2.2 AA scan', included: false },
    ],
    cta: 'Current Plan',
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: <Zap className="h-5 w-5" />,
    priceUsd: 19,
    priceInr: 1499,
    tagline: 'For professionals shipping products',
    popular: true,
    features: [
      { label: '100 audits per month', included: true },
      { label: 'Simple + Deep Audit (Playwright)', included: true },
      { label: 'Core Web Vitals (FCP, LCP, CLS, TTI)', included: true },
      { label: 'Technology + Content audit', included: true },
      { label: 'AI-powered executive summary', included: true },
      { label: 'PDF export', included: true },
      { label: 'axe-core WCAG 2.2 AA scan', included: true },
      { label: '3 team seats', included: true },
    ],
    cta: 'Upgrade to Pro',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: <Building2 className="h-5 w-5" />,
    priceUsd: 99,
    priceInr: 7999,
    tagline: 'Unlimited scale + white-label',
    features: [
      { label: 'Unlimited audits', included: true },
      { label: 'Everything in Pro', included: true },
      { label: 'API access', included: true },
      { label: 'White-label reports', included: true },
      { label: 'Unlimited team seats', included: true },
      { label: 'Priority support', included: true },
      { label: 'Custom integrations', included: true },
      { label: 'Dedicated account manager', included: true },
    ],
    cta: 'Upgrade to Enterprise',
  },
];

export function PricingView() {
  const { token, navigate } = useAppStore();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [currency, setCurrency] = useState<Currency>('usd');
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch('/api/usage', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.tier) setUsage(data); })
      .catch(console.error);

    // Best-effort currency detection from browser locale
    try {
      const locale = navigator.language || 'en-US';
      if (locale.includes('IN') || Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Calcutta' || Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Kolkata') {
        setCurrency('inr');
      }
    } catch {}
  }, [token]);

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free' || planId === usage?.tier) return;
    setError(null);
    setCheckingOut(planId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId, currency }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not start checkout. Please try again.');
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setCheckingOut(null);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not open billing portal.');
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  const symbol = currency === 'usd' ? '$' : '₹';

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('dashboard')}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
      </Button>

      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Choose Your Plan</h1>
        <p className="text-muted-foreground">Unlock deep audits, AI insights, and unlimited PDF exports</p>

        {/* Currency toggle */}
        <div className="inline-flex items-center rounded-lg border p-1 bg-muted/50">
          <button
            onClick={() => setCurrency('usd')}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${currency === 'usd' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}
          >
            USD ($)
          </button>
          <button
            onClick={() => setCurrency('inr')}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${currency === 'inr' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}
          >
            INR (₹)
          </button>
        </div>

        {usage && (
          <p className="text-sm text-muted-foreground">
            You're currently on the <strong>{usage.tierName}</strong> plan —{' '}
            {usage.auditsLimit === -1 ? 'unlimited audits' : `${usage.auditsUsed} of ${usage.auditsLimit} audits used this month`}
          </p>
        )}

        {usage && usage.tier !== 'free' && (
          <Button variant="outline" size="sm" onClick={handleManageBilling} disabled={portalLoading}>
            {portalLoading ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Settings className="h-3.5 w-3.5 mr-2" />}
            Manage Billing
          </Button>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/20 rounded-lg px-4 py-2 inline-block">{error}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PLANS.map((plan) => {
          const price = currency === 'usd' ? plan.priceUsd : plan.priceInr;
          const isCurrent = plan.id === usage?.tier;
          return (
            <Card
              key={plan.id}
              className={plan.popular ? 'border-2 border-primary shadow-lg relative' : 'relative'}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">Most Popular</Badge>
              )}
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {plan.icon}
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{symbol}{price.toLocaleString(currency === 'usd' ? 'en-US' : 'en-IN')}</span>
                  {price > 0 && <span className="text-sm text-muted-foreground">/month</span>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2.5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      {f.included ? (
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                      )}
                      <span className={f.included ? '' : 'text-muted-foreground/60'}>{f.label}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={isCurrent ? 'outline' : plan.popular ? 'default' : 'outline'}
                  disabled={isCurrent || plan.id === 'free' || checkingOut === plan.id}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {checkingOut === plan.id ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirecting...</>
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : (
                    plan.cta
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Secure checkout powered by Stripe. Cancel anytime.{' '}
        <a href="mailto:sales@sendit.co.in" className="underline">Need a custom plan?</a>
      </p>
    </div>
  );
}
