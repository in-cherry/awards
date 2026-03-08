import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const tenantId = searchParams.get('state');

  if (!code || !tenantId) {
    return NextResponse.json({ error: 'Code and state are required' }, { status: 400 });
  }

  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/mercadopago/callback`;

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
      },
      body: new URLSearchParams({
        client_secret: process.env.MP_CLIENT_SECRET || process.env.MP_ACCESS_TOKEN || '',
        client_id: process.env.MP_CLIENT_ID || '',
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('MP OAuth Token Error:', tokenData);
      return NextResponse.json({ error: 'Failed to get access token: ' + JSON.stringify(tokenData) }, { status: 400 });
    }

    const mpRecipientId = String(tokenData.user_id);

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        mpAccessToken: tokenData.access_token,
        mpRecipientId: mpRecipientId,
      }
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${tenant.slug}/admin`);

  } catch (error) {
    console.error('MP Callback Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
