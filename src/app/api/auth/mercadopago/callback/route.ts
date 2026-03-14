import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAppBaseUrl, getMercadoPagoRedirectUri, getRequiredEnv } from '@/core/shared/env';
import { isCuid } from '@/core/shared/validation';

type MercadoPagoTokenResponse = {
  access_token?: string;
  user_id?: number;
  error?: string;
  error_description?: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const tenantId = searchParams.get('state');

  if (!code || !tenantId) {
    return NextResponse.json({ error: 'Code and state are required' }, { status: 400 });
  }

  if (!isCuid(tenantId)) {
    return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
  }

  try {
    const clientId = getRequiredEnv('MP_CLIENT_ID');
    const clientSecret = getRequiredEnv('MP_CLIENT_SECRET');
    const redirectUri = getMercadoPagoRedirectUri();
    const appBaseUrl = getAppBaseUrl();

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, slug: true, isActive: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    if (!tenant.isActive) {
      return NextResponse.json({ error: 'Tenant is inactive' }, { status: 403 });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_secret: clientSecret,
        client_id: clientId,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    });

    const tokenData = (await tokenResponse.json()) as MercadoPagoTokenResponse;

    if (!tokenResponse.ok) {
      console.error('[MP OAuth Callback] Token exchange failed', {
        status: tokenResponse.status,
        tenantId,
        redirectUri,
        error: tokenData,
      });

      return NextResponse.json(
        { error: 'Failed to exchange authorization code with Mercado Pago' },
        { status: 400 }
      );
    }

    if (!tokenData.access_token || !tokenData.user_id) {
      console.error('[MP OAuth Callback] Missing token fields', {
        tenantId,
        redirectUri,
        tokenData,
      });

      return NextResponse.json(
        { error: 'Mercado Pago token response is missing required fields' },
        { status: 400 }
      );
    }

    const mpRecipientId = String(tokenData.user_id);

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        mpAccessToken: tokenData.access_token,
        mpRecipientId: mpRecipientId,
      }
    });

    return NextResponse.redirect(`${appBaseUrl}/${tenant.slug}/admin`);

  } catch (error) {
    console.error('[MP Callback] Internal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
