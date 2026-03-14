import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAuth } from '@/app/api/admin/_shared/require-admin-auth';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminAuth(req);
    if ('response' in auth) {
      return auth.response;
    }

    const body = await req.json();
    const {
      tenantId,
      logoUrl,
      faviconUrl,
      ownerName,
      avatarUrl,
      homeView,
      instagramUrl,
      telegramUrl,
      supportUrl,
    } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    if (tenantId !== auth.tenant.id) {
      return NextResponse.json({ error: 'Acesso negado para este tenant' }, { status: 403 });
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        logoUrl: logoUrl || null,
        faviconUrl: faviconUrl || null,
        instagramUrl: instagramUrl || null,
        telegramUrl: telegramUrl || null,
        supportUrl: supportUrl || null,
        homeView: homeView || "RAFFLE",
        owner: {
          update: {
            name: ownerName || undefined,
            avatarUrl: avatarUrl || null,
          }
        }
      },
    });

    return NextResponse.json({ success: true, tenant: updatedTenant });
  } catch (error) {
    console.error('Error updating tenant settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
