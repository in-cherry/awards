import { Footer } from "@/components/tenant/footer";
import { Header } from "@/components/tenant/header";
import prisma from "@/lib/database/prisma";
import { notFound } from "next/navigation";
import { motion } from "motion/react";
import { AppContextProvider } from "@/contexts";
import { Raffle } from "@/components/tenant/raffle";

interface TenantProps {
  params: Promise<{ slug: string }>
}

export default async function Tenant({ params }: TenantProps) {
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

  const activeRaffle = tenant.raffles[0] || null;

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
    pixText: activeRaffle.pixText,
    mysteryPrizes: activeRaffle.mysteryPrizes || []
  } : null;

  return (
    <div>
      <AppContextProvider tenant={tenantData} raffle={raffleData || undefined}>
        <Header />

        <Raffle />
        <Footer />
      </AppContextProvider>

    </div>
  );
}