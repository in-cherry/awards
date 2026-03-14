import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { adminSessionCookieName, createAdminSessionToken } from '@/core/auth/admin-session';

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;
const attemptsStore = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return request.headers.get('x-real-ip') ?? 'unknown';
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attemptsStore.get(key);

  if (!entry) {
    return false;
  }

  if (now > entry.resetAt) {
    attemptsStore.delete(key);
    return false;
  }

  return entry.count >= MAX_ATTEMPTS;
}

function registerFailedAttempt(key: string): void {
  const now = Date.now();
  const entry = attemptsStore.get(key);

  if (!entry || now > entry.resetAt) {
    attemptsStore.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  attemptsStore.set(key, { ...entry, count: entry.count + 1 });
}

function clearAttempts(key: string): void {
  attemptsStore.delete(key);
}

export async function POST(request: Request) {
  try {
    const { email, password, tenantSlug } = await request.json();
    const ip = getClientIp(request);

    if (!email || !password || !tenantSlug) {
      return NextResponse.json(
        { success: false, error: 'Email, senha e tenant são obrigatórios' },
        { status: 400 }
      );
    }

    const rateLimitKey = `${ip}:${tenantSlug}:${String(email).toLowerCase()}`;
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { success: false, error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 }
      );
    }

    // Buscar o tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      include: { owner: true }
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o usuário é o dono do tenant ou admin
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      registerFailedAttempt(rateLimitKey);
      return NextResponse.json(
        { success: false, error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      registerFailedAttempt(rateLimitKey);
      return NextResponse.json(
        { success: false, error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Verificar se é admin ou dono do tenant
    if (user.role !== 'ADMIN' && user.id !== tenant.ownerId) {
      registerFailedAttempt(rateLimitKey);
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    clearAttempts(rateLimitKey);

    const token = await createAdminSessionToken({
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      userId: user.id,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

    response.cookies.set(adminSessionCookieName, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Erro no login admin:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}