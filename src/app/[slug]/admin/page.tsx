import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { AdminPanel } from '@/components/Admin/AdminPanel';
import { SlugPageProps } from '@/lib/types';

export default async function AdminPage({ params }: SlugPageProps) {
  const { slug } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      customDomain: true,
      logoUrl: true,
      faviconUrl: true,
      raffles: {
        where: { status: { in: ['ACTIVE', 'FINISHED'] } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          totalNumbers: true,
          nextTicketNumber: true,
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

  if (!tenant) notFound();

  const totalRevenue = tenant.raffles.reduce(
    (sum: number, r: any) => sum + r._count.tickets * Number(r.price),
    0
  );

  const stats = {
    totalTicketsSold: tenant.raffles.reduce((sum: number, r: any) => sum + r._count.tickets, 0),
    totalRevenue,
    totalFee: totalRevenue * 0.2,
    netRevenue: totalRevenue * 0.8,
    totalBuyers: await prisma.client.count({ where: { tenantId: tenant.id } }),
  };

  return (
    <AdminPanel
      tenant={{ id: tenant.id, name: tenant.name, slug: tenant.slug, customDomain: tenant.customDomain, logoUrl: tenant.logoUrl ?? undefined, faviconUrl: tenant.faviconUrl ?? undefined }}
      stats={stats}
      raffles={tenant.raffles.map((r: any) => ({
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
    />
  );
}
