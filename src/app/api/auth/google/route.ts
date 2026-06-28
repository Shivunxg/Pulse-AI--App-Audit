import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ error: 'Google sign-in is not configured. Set Supabase environment variables.' }, { status: 503 });
  }

  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/api/auth/google/callback`,
    },
  });

  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.json({ error: 'Failed to initiate Google sign-in' }, { status: 500 });
  }

  return NextResponse.redirect(data.url);
}