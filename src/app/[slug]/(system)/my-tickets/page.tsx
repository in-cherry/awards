import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { MyTicketsClient } from './MyTicketsClient';
import { SlugSearchPageProps } from '@/lib/types';

export default async function MyTicketsPage({ params, searchParams }: SlugSearchPageProps) {
  const { slug } = await params;
  const { cpf } = await searchParams;

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) notFound();

  const clientCpf = typeof cpf === 'string' ? cpf.replace(/\D/g, '') : null;

  if (!clientCpf) {
    return <MyTicketsClient slug={slug} initialData={null} />;
  }

  const client = await prisma.client.findUnique({
    where: { tenantId_cpf: { tenantId: tenant.id, cpf: clientCpf } },
  });

  if (!client) {
    return <MyTicketsClient slug={slug} initialData={null} notFound />;
  }

  const payments = await prisma.payment.findMany({
    where: { clientId: client.id, tenantId: tenant.id, status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      amount: true,
      ticketCount: true,
      boxesGranted: true,
      createdAt: true,
      raffle: {
        select: { id: true, title: true, mysteryBoxEnabled: true },
      },
      tickets: {
        select: { number: true },
        orderBy: { number: 'asc' },
      },
      mysteryWon: {
        select: {
          id: true,
          boxIndex: true,
          prize: { select: { id: true, title: true } },
        },
      },
    },
  });

  const data = payments.map((p) => ({
    id: p.id,
    amount: Number(p.amount),
    ticketCount: p.ticketCount,
    boxesGranted: p.boxesGranted,
    createdAt: p.createdAt.toISOString(),
    raffle: p.raffle,
    tickets: p.tickets.map((t) => t.number),
    openedBoxes: p.mysteryWon.map((w) => ({
      id: w.id,
      boxIndex: w.boxIndex,
      prizeId: w.prize.id,
      prizeName: w.prize.title,
    })),
  }));

  return (
    <MyTicketsClient
      slug={slug}
      initialData={{ cpf: clientCpf, name: client.name, payments: data }}
    />
  );
}


