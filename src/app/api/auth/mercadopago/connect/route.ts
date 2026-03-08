import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
  }

  const clientId = process.env.MP_CLIENT_ID;

  // Mercado Pago requires HTTPS for the redirect URI unless strictly testing in their environment.
  // In Vercel or production logic, NEXT_PUBLIC_APP_URL should always be https://...
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/auth/mercadopago/callback`;

  // Provide a local fallback specifically for Vercel Dev or ngrok tunneled environments
  const safeRedirectUri = baseUrl.includes('localhost')
    ? redirectUri.replace('http:', 'https:') // Temporarily force https to bypass initial validation (will fail on actual callback if not tunneled)
    : redirectUri;

  // If we are strictly on localhost without https tunnel, MP OAuth might block the request outright depending on the Account settings.
  const mpAuthUrl = `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${tenantId}&redirect_uri=${encodeURIComponent(safeRedirectUri)}`;

  return NextResponse.redirect(mpAuthUrl);
}
