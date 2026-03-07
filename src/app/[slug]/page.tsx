import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, LayoutDashboard } from 'lucide-react';
import { AppContextProvider } from '@/contexts/AppContext';
import { Header } from '@/components/Header';
import { SearchBar } from '@/components/SearchBar';
import { RaffleInfo } from '@/components/RaffleInfo';
import { MysteryBoxInfo } from '@/components/MysteryBoxInfo';
import { Ranking } from '@/components/Ranking';
import { TicketSelector } from '@/components/TicketSelector';
import { Footer } from '@/components/Footer';
import Link from 'next/link';
import TenantPage from './TenantPage';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Tenant({ params }: PageProps) {
  const { slug } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      raffles: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!tenant) {
    notFound();
  }

  // Pega a rifa ativa mais recente
  const activeRaffle = tenant.raffles[0] || null;

  // Prepara os dados do tenant e raffle para o contexto
  const tenantData = {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    logoUrl: tenant.logoUrl,
    isActive: tenant.isActive
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
    winnerId: activeRaffle.winnerId
  } : null;

  return (
    <AppContextProvider tenant={tenantData} raffle={raffleData || undefined}>
      <TenantPage />
    </AppContextProvider>
  );
}
