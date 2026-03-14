import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AdminSessionPayload, getAdminSessionFromRequest } from '@/core/auth/admin-session';

type AuthorizedAdminContext = {
  session: AdminSessionPayload;
  tenant: { id: string; slug: string; ownerId: string };
  user: { id: string; role: string };
};

type UnauthorizedAdminContext = {
  response: NextResponse;
};

export async function requireAdminAuth(request: NextRequest): Promise<AuthorizedAdminContext | UnauthorizedAdminContext> {
  const session = await getAdminSessionFromRequest(request);
  if (!session) {
    return { response: NextResponse.json({ error: 'Nao autenticado' }, { status: 401 }) };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { id: true, slug: true, ownerId: true },
  });

  if (!tenant || tenant.slug !== session.tenantSlug) {
    return { response: NextResponse.json({ error: 'Sessao invalida' }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true },
  });

  if (!user || (user.role !== 'ADMIN' && user.id !== tenant.ownerId)) {
    return { response: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) };
  }

  return {
    session,
    tenant,
    user,
  };
}