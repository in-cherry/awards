import { NextResponse } from 'next/server';
import { getMercadoPagoRedirectUri, getRequiredEnv } from '@/core/shared/env';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
  }

  try {
    const clientId = getRequiredEnv('MP_CLIENT_ID');
    const redirectUri = getMercadoPagoRedirectUri();
    const mpAuthUrl = `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${tenantId}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    return NextResponse.redirect(mpAuthUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown connect error';
    console.error('[MP OAuth Connect] Invalid configuration:', message);

    return NextResponse.json(
      { error: 'OAuth configuration error. Check server environment.' },
      { status: 500 }
    );
  }
}
