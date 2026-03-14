import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import React from 'react';
import { AppContextProvider } from '@/contexts/AppContext';
import TenantPage from './TenantPage';



interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Tenant({ params }: PageProps) {
  const { slug } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      owner: {
        select: {
          name: true,
          avatarUrl: true
        }
      },
      raffles: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        include: {
          mysteryPrizes: {
            include: {
              winners: {
                include: {
                  client: { select: { name: true } }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!tenant) {
    notFound();
  }

  if (tenant.homeView === 'LIST') {
    redirect(`/${tenant.slug}/rifas`);
  }

  // Pega a rifa ativa mais recente
  const activeRaffle = tenant.raffles[0] || null;

  // Prepara os dados do tenant e raffle para o contexto
  const tenantData = {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    logoUrl: tenant.logoUrl,
    instagramUrl: tenant.instagramUrl,
    telegramUrl: tenant.telegramUrl,
    supportUrl: tenant.supportUrl,
    isActive: tenant.isActive,
    owner: {
      name: tenant.owner.name,
      avatarUrl: tenant.owner.avatarUrl || null,
    }
  };

  const raffleData = activeRaffle ? {
    id: activeRaffle.id,
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
    mysteryPrizes: activeRaffle.mysteryPrizes || []
  } : null;

  return (
    <AppContextProvider tenant={tenantData} raffle={raffleData || undefined}>
      <TenantPage />
    </AppContextProvider>
  );
}
