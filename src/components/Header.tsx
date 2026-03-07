"use client";

import { useApp } from '@/contexts/AppContext';
import React from 'react';
import { motion } from 'motion/react';
import { Ticket } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  const { tenant, setIsLoginModalOpen } = useApp();

  return (
    <header className="py-8 flex justify-between items-center px-4 max-w-2xl mx-auto">
      <Link href={tenant?.slug ? `/${tenant.slug}` : '/'}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-1 cursor-pointer"
        >
          <span className="text-2xl font-black tracking-tighter font-display"> {tenant ? tenant.name : 'Winzy Awards'} </span>
        </motion.div>
      </Link>

      <button
        onClick={() => setIsLoginModalOpen(true)}
        className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"
      >
        <Ticket size={16} />
        Meus Bilhetes
      </button>
    </header>
  );
}