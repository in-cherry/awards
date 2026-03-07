import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { parseMysteryBoxConfig } from '@/lib/mystery-box';
import { CheckoutClient } from './CheckoutClient';
import { SlugSearchPageProps } from '@/lib/types';

export default async function CheckoutPage({ params, searchParams }: SlugSearchPageProps) {
  const { slug } = await params;
  const { raffle: raffleId } = await searchParams;

  if (!raffleId || typeof raffleId !== 'string') {
    notFound();
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (!tenant) {
    notFound();
  }

  const raffle = await prisma.raffle.findFirst({
    where: { id: raffleId, tenantId: tenant.id, status: 'ACTIVE' },
    include: {
      mysteryPrizes: {
        where: { remaining: { gt: 0 } },
        select: { id: true, title: true, remaining: true, totalAmount: true },
      },
    },
  });

  if (!raffle) {
    notFound();
  }

  const mysteryBoxConfig = raffle.mysteryBoxEnabled
    ? parseMysteryBoxConfig(raffle.mysteryBoxConfig)
    : null;

  const availablePrizesCount = raffle.mysteryPrizes.reduce(
    (sum, p) => sum + p.remaining,
    0
  );

  return (
    <CheckoutClient
      slug={slug}
      raffle={{
        id: raffle.id,
        title: raffle.title,
        price: Number(raffle.price),
        minNumbers: raffle.minNumbers,
        totalNumbers: raffle.totalNumbers,
        mysteryBoxEnabled: raffle.mysteryBoxEnabled && availablePrizesCount > 0,
        mysteryBoxConfig,
      }}
    />
  );
}

