import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import React from 'react';
import { AppContextProvider } from '@/contexts/AppContext';
import TenantPage from '../../TenantPage';

interface PageProps {
  params: Promise<{ slug: string; raffleSlug: string }>;
}

export default async function RaffleBySlugPage({ params }: PageProps) {
  const { slug, raffleSlug } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      owner: {
        select: {
          name: true,
          avatarUrl: true,
        },
      },
      raffles: {
        where: { slug: raffleSlug, status: 'ACTIVE' },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          bannerUrl: true,
          price: true,
          minNumbers: true,
          totalNumbers: true,
          status: true,
          drawDate: true,
          nextTicketNumber: true,
          mysteryBoxEnabled: true,
          mysteryBoxConfig: true,
          winnerId: true,
          mysteryPrizes: {
            include: {
              winners: {
                include: {
                  client: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!tenant || tenant.raffles.length === 0) {
    notFound();
  }

  const activeRaffle = tenant.raffles[0];

  const tenantData = {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    logoUrl: tenant.logoUrl,
    isActive: tenant.isActive,
    owner: {
      name: tenant.owner?.name || '',
      avatarUrl: tenant.owner?.avatarUrl || null,
    },
  };

  const raffleData = {
    id: activeRaffle.id,
    slug: activeRaffle.slug,
    title: activeRaffle.title,
    description: activeRaffle.description,
    bannerUrl: activeRaffle.bannerUrl,
    price: Number(activeRaffle.price),
    minNumbers: activeRaffle.minNumbers,
    totalNumbers: activeRaffle.totalNumbers,
    status: activeRaffle.status,
    drawDate: activeRaffle.drawDate,
    nextTicketNumber: activeRaffle.nextTicketNumber,
    mysteryBoxEnabled: activeRaffle.mysteryBoxEnabled,
    mysteryBoxConfig: activeRaffle.mysteryBoxConfig,
    winnerId: activeRaffle.winnerId,
    mysteryPrizes: activeRaffle.mysteryPrizes || [],
  };

  return (
    <AppContextProvider tenant={tenantData} raffle={raffleData}>
      <TenantPage />
    </AppContextProvider>
  );
}
