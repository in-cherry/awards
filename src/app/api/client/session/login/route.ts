import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { clientSessionCookieName, createClientSessionToken } from '@/core/auth/client-session';

function normalizeCpf(input: string): string {
  return input.replace(/\D/g, '');
}

function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tenantSlug = String(body?.tenantSlug ?? '').trim();
    const cpf = normalizeCpf(String(body?.cpf ?? ''));
    const email = normalizeEmail(String(body?.email ?? ''));

    if (!tenantSlug || cpf.length !== 11 || !email) {
      return NextResponse.json({ success: false, error: 'Dados invalidos' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, slug: true, isActive: true },
    });

    if (!tenant || !tenant.isActive) {
      return NextResponse.json({ success: false, error: 'Tenant invalida' }, { status: 404 });
    }

    const client = await prisma.client.findUnique({
      where: { tenantId_cpf: { tenantId: tenant.id, cpf } },
      select: { name: true, email: true, phone: true, cpf: true },
    });

    if (!client || normalizeEmail(client.email) !== email) {
      return NextResponse.json({ success: false, error: 'Credenciais invalidas' }, { status: 401 });
    }

    const token = await createClientSessionToken({
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      cpf,
    });

    const response = NextResponse.json({
      success: true,
      client,
    });

    response.cookies.set(clientSessionCookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Erro ao criar sessao de cliente:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}