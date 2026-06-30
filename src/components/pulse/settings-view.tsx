'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, User, CreditCard, Lock, LogOut, Loader2, Check,
  Sparkles, Shield, Mail,
} from 'lucide-react';

interface UsageData {
  tier: string;
  tierName: string;
  auditsUsed: number;
  auditsLimit: number;
  daysUntilReset: number;
}

export function SettingsView() {
  const { token, user, navigate, logout, setAuth } = useAppStore();
  const [usage, setUsage] = useState<UsageData | null>(null);

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Billing state
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch('/api/usage', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.tier) setUsage(data); })
      .catch(console.error);
  }, [token]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileError(null);
    setProfileSaved(false);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) { setProfileError(data.error || 'Failed to save'); return; }
      if (user && token) setAuth({ ...user, name: data.user.name }, token);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch {
      setProfileError('Network error. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSaved(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setPasswordError(data.error || 'Failed to change password'); return; }
      setPasswordSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSaved(false), 2500);
    } catch {
      setPasswordError('Network error. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        navigate('pricing');
      }
    } catch {
      navigate('pricing');
    } finally {
      setPortalLoading(false);
    }
  };

  const tierColor = usage?.tier === 'enterprise' ? 'bg-violet-100 text-violet-700 border-violet-200'
    : usage?.tier === 'pro' ? 'bg-blue-100 text-blue-700 border-blue-200'
    : 'bg-muted text-muted-foreground';

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate('dashboard')}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account, plan, and security</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Profile</CardTitle>
          </div>
          <CardDescription>Your basic account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm">{user?.email}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs">Display Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          {profileError && <p className="text-xs text-red-600">{profileError}</p>}
          <Button size="sm" onClick={handleSaveProfile} disabled={savingProfile}>
            {savingProfile ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : profileSaved ? <Check className="h-3.5 w-3.5 mr-2" /> : null}
            {profileSaved ? 'Saved' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Plan & Billing</CardTitle>
          </div>
          <CardDescription>Your subscription and usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {usage ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Current Plan</span>
                    <Badge variant="outline" className={tierColor}>{usage.tierName}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {usage.auditsLimit === -1
                      ? 'Unlimited audits'
                      : `${usage.auditsUsed} of ${usage.auditsLimit} audits used this month`}
                    {usage.tier !== 'free' && ` · Resets in ${usage.daysUntilReset} days`}
                  </p>
                </div>
                {usage.tier === 'free' ? (
                  <Button size="sm" onClick={() => navigate('pricing')}>
                    <Sparkles className="h-3.5 w-3.5 mr-2" /> Upgrade
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={handleManageBilling} disabled={portalLoading}>
                    {portalLoading ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : null}
                    Manage Billing
                  </Button>
                )}
              </div>

              {usage.tier !== 'free' && (
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all"
                    style={{ width: usage.auditsLimit === -1 ? '100%' : `${Math.min(100, (usage.auditsUsed / usage.auditsLimit) * 100)}%` }}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="h-12 bg-muted/50 rounded animate-pulse" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Security</CardTitle>
          </div>
          <CardDescription>Change your password. Google Sign-In users manage their password through Google.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current-password" className="text-xs">Current Password</Label>
            <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-xs">New Password</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 characters" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-xs">Confirm New Password</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" />
            </div>
          </div>
          {passwordError && <p className="text-xs text-red-600">{passwordError}</p>}
          <Button
            size="sm"
            variant="outline"
            onClick={handleChangePassword}
            disabled={changingPassword || !currentPassword || !newPassword}
          >
            {changingPassword ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : passwordSaved ? <Check className="h-3.5 w-3.5 mr-2" /> : <Shield className="h-3.5 w-3.5 mr-2" />}
            {passwordSaved ? 'Password Changed' : 'Change Password'}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <Card className="border-destructive/30">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Sign out</p>
            <p className="text-xs text-muted-foreground">Sign out of Pulse AI on this device</p>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="h-3.5 w-3.5 mr-2" /> Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
