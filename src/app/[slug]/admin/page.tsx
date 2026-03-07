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
          _count: { select: { tickets: true, payments: true } },
        },
      },
    },
  });

  if (!tenant) notFound();

  const stats = {
    totalTicketsSold: tenant.raffles.reduce((sum, r) => sum + r._count.tickets, 0),
    totalRevenue: tenant.raffles.reduce(
      (sum, r) => sum + r._count.tickets * Number(r.price),
      0
    ),
    totalBuyers: await prisma.client.count({ where: { tenantId: tenant.id } }),
  };

  return (
    <AdminPanel
      tenant={{ id: tenant.id, name: tenant.name, slug: tenant.slug }}
      stats={stats}
      raffles={tenant.raffles.map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        totalNumbers: r.totalNumbers,
        soldTickets: r._count.tickets,
        price: Number(r.price),
        mysteryBoxEnabled: r.mysteryBoxEnabled,
      }))}
    />
  );
}
