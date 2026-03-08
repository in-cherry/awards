import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/auth/mercadopago/callback
 *
 * Ponto de retorno do fluxo OAuth do Mercado Pago.
 * O MP redireciona para cá após o tenant autorizar o acesso.
 *
 * Query params enviados pelo MP:
 *   - code   → código de autorização (trocado por access_token)
 *   - state  → slug do tenant (passado na URL de autorização)
 *   - error  → presente se o usuário negou o acesso
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // tenant slug
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Acesso negado pelo usuário
  if (error || !code || !state) {
    console.warn('[OAuth MP] Acesso negado ou parâmetros inválidos:', { error, code: !!code, state });
    return NextResponse.redirect(`${baseUrl}/${state}/admin?mp_oauth=denied`);
  }

  // Resolver tenant pelo slug (state)
  const tenant = await prisma.tenant.findUnique({ where: { slug: state } });
  if (!tenant) {
    console.error('[OAuth MP] Tenant não encontrado:', state);
    return NextResponse.redirect(`${baseUrl}/admin?mp_oauth=error&reason=tenant_not_found`);
  }

  try {
    // Trocar o code pelo access_token na API do Mercado Pago
    const tokenRes = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.MP_CLIENT_ID,
        client_secret: process.env.MP_CLIENT_SECRET,
        code,
        redirect_uri: `${baseUrl}/api/auth/mercadopago/callback`,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('[OAuth MP] Erro ao trocar code por token:', err);
      return NextResponse.redirect(`${baseUrl}/${state}/admin?mp_oauth=error&reason=token_exchange`);
    }

    const tokenData: {
      access_token: string;
      refresh_token: string;
      user_id: number;
      public_key: string;
      token_type: string;
      expires_in: number;
    } = await tokenRes.json();

    console.log(`[OAuth MP] Token obtido para tenant ${tenant.slug} | user_id: ${tokenData.user_id}`);

    // Salvar credenciais do tenant no banco
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        mpAccessToken: tokenData.access_token,
        mpRecipientId: String(tokenData.user_id),
      },
    });

    console.log(`[OAuth MP] ✅ Tenant ${tenant.slug} conectado ao Mercado Pago com sucesso`);

    return NextResponse.redirect(`${baseUrl}/${state}/admin?mp_oauth=success`);
  } catch (err) {
    console.error('[OAuth MP] Erro inesperado:', err);
    return NextResponse.redirect(`${baseUrl}/${state}/admin?mp_oauth=error&reason=unexpected`);
  }
}
