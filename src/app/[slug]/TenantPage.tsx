"use client";

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, LayoutDashboard } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/Header';
import { SearchBar } from '@/components/SearchBar';
import { RaffleInfo } from '@/components/RaffleInfo';
import { MysteryBoxInfo } from '@/components/MysteryBoxInfo';
import { Ranking } from '@/components/Ranking';
import { TicketSelector } from '@/components/TicketSelector';
import { TrustBadges } from '@/components/TrustBadges';
import { Footer } from '@/components/Footer';
import { LoginModal } from '@/components/Modals/LoginModal';
import { PurchaseModal } from '@/components/Modals/PurchaseModal';
import { MysteryBoxModal } from '@/components/Modals/MysteryBoxModal';
import { PhoneConfirmModal } from '@/components/Modals/PhoneConfirmModal';
import Link from 'next/link';

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

export default function TenantPage() {
  const { raffle, tenant } = useApp();

  return (
    <div className="min-h-screen font-sans selection:bg-emerald-500/30 bg-[#0f172a] text-white overflow-x-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[120px] animate-blob animation-delay-4000" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key="home"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={containerVariants}
          className="relative z-10 pb-12"
        >
          <Header />

          <main className="max-w-2xl mx-auto px-4 mt-8 space-y-8">
            {/* Raffle Status Banner */}
            {raffle?.status === 'FINISHED' && (
              <motion.div
                variants={itemVariants}
                className="bg-emerald-500 text-white p-6 rounded-3xl text-center space-y-2 shadow-lg shadow-emerald-500/20"
              >
                <Trophy className="mx-auto mb-2" size={32} />
                <h2 className="text-xl font-black font-display tracking-tight uppercase">Sorteio Finalizado!</h2>
                <p className="text-sm font-bold opacity-90">Ganhador: <span className="text-white underline">{raffle.winnerId || 'A definir'}</span></p>
              </motion.div>
            )}

            <SearchBar />
            <RaffleInfo />
            <MysteryBoxInfo />
            <Ranking />

            <TicketSelector />
            <TrustBadges />
            <Footer />
          </main>
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <LoginModal />
      <PurchaseModal />
      <MysteryBoxModal />
      <PhoneConfirmModal />
    </div>
  );
}
