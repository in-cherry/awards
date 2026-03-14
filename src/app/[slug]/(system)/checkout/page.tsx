import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { parseMysteryBoxConfig } from '@/lib/mystery-box';
import { CheckoutClient } from './CheckoutClient';
import { SlugSearchPageProps } from '@/lib/types';
import { AppContextProvider } from '@/contexts/AppContext';

export default async function CheckoutPage({ params, searchParams }: SlugSearchPageProps) {
  const { slug } = await params;
  const { raffle: raffleRef } = await searchParams;

  if (!raffleRef || typeof raffleRef !== 'string') {
    notFound();
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (!tenant) {
    notFound();
  }

  const raffle = await prisma.raffle.findFirst({
    where: {
      tenantId: tenant.id,
      status: 'ACTIVE',
      OR: [{ id: raffleRef }, { slug: raffleRef }],
    },
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
    (sum: number, p: any) => sum + p.remaining,
    0
  );

  const tenantData = {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    logoUrl: tenant.logoUrl,
    instagramUrl: tenant.instagramUrl,
    telegramUrl: tenant.telegramUrl,
    supportUrl: tenant.supportUrl,
    isActive: tenant.isActive,
  };

  return (
    <AppContextProvider tenant={tenantData}>
      <CheckoutClient
        slug={slug}
        raffle={{
          id: raffle.id,
          slug: raffle.slug,
          title: raffle.title,
          price: Number(raffle.price),
          minNumbers: raffle.minNumbers,
          totalNumbers: raffle.totalNumbers,
          mysteryBoxEnabled: raffle.mysteryBoxEnabled && availablePrizesCount > 0,
          mysteryBoxConfig,
        }}
      />
    </AppContextProvider>
  );
}

