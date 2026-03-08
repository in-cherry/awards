import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenantId, logoUrl, faviconUrl, ownerName, avatarUrl, homeView } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        logoUrl: logoUrl || null,
        faviconUrl: faviconUrl || null,
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
