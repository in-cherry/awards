import { NextResponse } from 'next/server';
import { adminSessionCookieName } from '@/core/auth/admin-session';

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set(adminSessionCookieName, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    path: '/',
  });

  return response;
}
