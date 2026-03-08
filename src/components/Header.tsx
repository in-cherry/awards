"use client";

import React from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import Image from 'next/image';

export function Header() {
  const { tenant } = useApp();

  return (
    <header className="py-6 flex justify-center sticky top-0 bg-[#0f172a]/80 backdrop-blur-md z-40 border-b border-white/5">
      <Link href={tenant?.slug ? `/${tenant.slug}` : '/'} className="flex items-center gap-3">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-3 cursor-pointer group"
        >
          {tenant?.logoUrl && (
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Image
                src={tenant.logoUrl}
                alt={`Logo ${tenant.name}`}
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
                unoptimized
              />
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="text-2xl font-black tracking-tighter font-display">{tenant?.name || 'Sav'}</span>
            <span className="text-2xl font-light tracking-widest text-emerald-400 font-display">/Awards</span>
          </div>
        </motion.div>
      </Link>
    </header>
  );
}