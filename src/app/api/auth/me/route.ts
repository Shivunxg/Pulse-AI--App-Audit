import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, logoutUser, getTokenFromHeader } from '@/lib/auth';
import { buildClearSessionCookie } from '@/lib/session-cookie';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request);
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    // Echo the token back so the client can populate its in-memory store
    // (token is sourced from the httpOnly cookie when present — the client
    // never has to read the cookie itself, just receives this response).
    return NextResponse.json({ user, token });
  } catch (err) {
    console.error('Auth check error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request);
    if (token) await logoutUser(token);
    const res = NextResponse.json({ success: true });
    res.headers.set('Set-Cookie', buildClearSessionCookie());
    return res;
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}