import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { AdminPanel } from '@/components/features/admin/admin-panel';
import { SlugPageProps } from '@/lib/types';
import { cookies } from 'next/headers';
import { adminSessionCookieName, verifyAdminSessionToken } from '@/core/auth/admin-session';

export default async function AdminPage({ params }: SlugPageProps) {
  const { slug } = await params;

  const tenantBase = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      customDomain: true,
      logoUrl: true,
      faviconUrl: true,
      metaTitle: true,
      metaDescription: true,
      instagramUrl: true,
      telegramUrl: true,
      supportUrl: true,
      ownerId: true,
    },
  });

  if (!tenantBase) notFound();

  const cookieStore = await cookies();
  const token = cookieStore.get(adminSessionCookieName)?.value;
  const session = token ? await verifyAdminSessionToken(token) : null;

  let isAuthenticated = false;
  if (session && session.tenantSlug === slug && session.tenantId === tenantBase.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: true },
    });
    isAuthenticated = !!user && (user.role === 'ADMIN' || user.id === tenantBase.ownerId);
  }

  const tenant = {
    id: tenantBase.id,
    name: tenantBase.name,
    slug: tenantBase.slug,
    customDomain: tenantBase.customDomain,
    logoUrl: tenantBase.logoUrl,
    faviconUrl: tenantBase.faviconUrl,
    metaTitle: tenantBase.metaTitle,
    metaDescription: tenantBase.metaDescription,
    instagramUrl: tenantBase.instagramUrl,
    telegramUrl: tenantBase.telegramUrl,
    supportUrl: tenantBase.supportUrl,
  };

  if (!isAuthenticated) {
    return (
      <AdminPanel
        tenant={{
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          customDomain: tenant.customDomain,
          logoUrl: tenant.logoUrl ?? undefined,
          faviconUrl: tenant.faviconUrl ?? undefined,
          metaTitle: tenant.metaTitle ?? undefined,
          metaDescription: tenant.metaDescription ?? undefined,
          instagramUrl: tenant.instagramUrl ?? undefined,
          telegramUrl: tenant.telegramUrl ?? undefined,
          supportUrl: tenant.supportUrl ?? undefined,
        }}
        stats={{ totalTicketsSold: 0, totalRevenue: 0, totalFee: 0, netRevenue: 0, totalBuyers: 0 }}
        raffles={[]}
        initialAuthenticated={false}
      />
    );
  }

  const tenantWithData = await prisma.tenant.findUnique({
    where: { id: tenant.id },
    select: {
      id: true,
      raffles: {
        where: { status: { in: ['ACTIVE', 'FINISHED'] } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          totalNumbers: true,
          price: true,
          mysteryBoxEnabled: true,
          description: true,
          bannerUrl: true,
          minNumbers: true,
          _count: { select: { tickets: true, payments: true } },
        },
      },
    },
  });

  if (!tenantWithData) notFound();

  const totalRevenue = tenantWithData.raffles.reduce(
    (sum: number, r: any) => sum + r._count.tickets * Number(r.price),
    0
  );

  const stats = {
    totalTicketsSold: tenantWithData.raffles.reduce((sum: number, r: any) => sum + r._count.tickets, 0),
    totalRevenue,
    totalFee: totalRevenue * 0.2,
    netRevenue: totalRevenue * 0.8,
    totalBuyers: await prisma.client.count({ where: { tenantId: tenant.id } }),
  };

  return (
    <AdminPanel
      tenant={{
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        customDomain: tenant.customDomain,
        logoUrl: tenant.logoUrl ?? undefined,
        faviconUrl: tenant.faviconUrl ?? undefined,
        metaTitle: tenant.metaTitle ?? undefined,
        metaDescription: tenant.metaDescription ?? undefined,
        instagramUrl: tenant.instagramUrl ?? undefined,
        telegramUrl: tenant.telegramUrl ?? undefined,
        supportUrl: tenant.supportUrl ?? undefined,
      }}
      stats={stats}
      raffles={tenantWithData.raffles.map((r: any) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        totalNumbers: r.totalNumbers,
        soldTickets: r._count.tickets,
        price: Number(r.price),
        mysteryBoxEnabled: r.mysteryBoxEnabled,
        minNumbers: r.minNumbers,
        bannerUrl: r.bannerUrl,
        description: r.description,
      }))}
      initialAuthenticated
    />
  );
}
