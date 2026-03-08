import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/auth/mercadopago/connect?tenant=<slug>
 *
 * Inicia o fluxo OAuth do Mercado Pago para um tenant.
 * Redireciona o admin para a tela de autorização do MP.
 *
 * O admin do tenant acessa este endpoint através do painel.
 * Após autorizar, o MP redireciona para /api/auth/mercadopago/callback.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get('tenant');

  if (!tenantSlug) {
    return NextResponse.json({ error: 'Parâmetro "tenant" é obrigatório.' }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant não encontrado.' }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const callbackUrl = `${baseUrl}/api/auth/mercadopago/callback`;
  const clientId = process.env.MP_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json({ error: 'Credenciais do Mercado Pago não configuradas.' }, { status: 500 });
  }

  // URL de autorização OAuth do Mercado Pago
  // "state" carrega o slug do tenant para identificá-lo no callback
  const authUrl = new URL('https://auth.mercadopago.com/authorization');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('platform_id', 'mp');
  authUrl.searchParams.set('redirect_uri', callbackUrl);
  authUrl.searchParams.set('state', tenant.slug);

  console.log(`[OAuth MP] Iniciando autorização para tenant ${tenant.slug}`);
  console.log(`[OAuth MP] Redirect URI: ${callbackUrl}`);

  return NextResponse.redirect(authUrl.toString());
}
