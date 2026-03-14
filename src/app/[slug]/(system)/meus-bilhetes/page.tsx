import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { MyTicketsClient } from './MyTicketsClient';
import { SlugSearchPageProps } from '@/lib/types';
import { AppContextProvider } from '@/contexts/AppContext';
import { readOpenedMysteryBoxes } from '@/core/mystery-box/opened-box-state';
import { cookies } from 'next/headers';
import { clientSessionCookieName, verifyClientSessionToken } from '@/core/auth/client-session';

export default async function MyTicketsPage({ params, searchParams }: SlugSearchPageProps) {
  const { slug } = await params;
  await searchParams;

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) notFound();

  const cookieStore = await cookies();
  const token = cookieStore.get(clientSessionCookieName)?.value;
  const clientSession = token ? await verifyClientSessionToken(token) : null;

  const sessionMatchesTenant =
    clientSession && clientSession.tenantId === tenant.id && clientSession.tenantSlug === tenant.slug;

  const clientCpf = sessionMatchesTenant ? clientSession.cpf : null;

  const tenantData = {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    logoUrl: tenant.logoUrl,
    isActive: tenant.isActive
  };

  if (!clientCpf) {
    return (
      <AppContextProvider tenant={tenantData}>
        <MyTicketsClient slug={slug} initialData={null} />
      </AppContextProvider>
    );
  }

  const client = await prisma.client.findUnique({
    where: { tenantId_cpf: { tenantId: tenant.id, cpf: clientCpf } },
  });

  if (!client) {
    return (
      <AppContextProvider tenant={tenantData}>
        <MyTicketsClient slug={slug} initialData={null} notFound />
      </AppContextProvider>
    );
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
        select: { id: true, slug: true, title: true, mysteryBoxEnabled: true },
      },
      metadata: true,
      tickets: {
        select: { numberFormatted: true },
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

  const data = payments.map((p: any) => {
    const openedWithoutPrize = readOpenedMysteryBoxes(p.metadata)
      .filter((entry) => !entry.won)
      .map((entry) => ({
        id: `no-prize-${entry.boxIndex}`,
        boxIndex: entry.boxIndex,
        prizeId: '',
        prizeName: '',
      }));

    return {
      id: p.id,
      amount: Number(p.amount),
      ticketCount: p.ticketCount,
      boxesGranted: p.boxesGranted,
      createdAt: p.createdAt.toISOString(),
      raffle: p.raffle,
      tickets: p.tickets.map((t: any) => t.numberFormatted),
      openedBoxes: [
        ...p.mysteryWon.map((w: any) => ({
          id: w.id,
          boxIndex: w.boxIndex,
          prizeId: w.prize.id,
          prizeName: w.prize.title,
        })),
        ...openedWithoutPrize,
      ].sort((a: any, b: any) => a.boxIndex - b.boxIndex),
    };
  });

  return (
    <AppContextProvider tenant={tenantData}>
      <MyTicketsClient
        slug={slug}
        initialData={{ cpf: clientCpf, name: client.name, payments: data }}
      />
    </AppContextProvider>
  );
}


