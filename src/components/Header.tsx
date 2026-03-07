"use client";

import React from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';

export function Header() {
  const { tenant } = useApp();

  return (
    <header className="py-8 flex justify-center sticky top-0 bg-[#0f172a]/80 backdrop-blur-md z-50 border-b border-white/5">
      <Link href={tenant?.slug ? `/${tenant.slug}` : '/'}>
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-1 cursor-pointer"
        >
          <span className="text-4xl font-black tracking-tighter font-display">{tenant?.name || 'Sav'}</span>
          <span className="text-4xl font-light tracking-widest text-emerald-400 font-display">/Awards</span>
        </motion.div>
      </Link>
    </header>
  );
}