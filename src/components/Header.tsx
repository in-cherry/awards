"use client";

import React from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import Image from 'next/image';

export function Header() {
  const { tenant } = useApp();
  const pathname = usePathname();
  const isRifasPage = pathname === `/${tenant?.slug}/rifas`;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/35 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Link href={tenant?.slug ? `/${tenant.slug}` : '/'} className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {tenant?.logoUrl && (
              <div className="h-11 w-11 rounded-xl overflow-hidden border border-white/15 bg-white/5 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Image
                  src={tenant.logoUrl}
                  alt={`Logo ${tenant.name}`}
                  width={30}
                  height={30}
                  className="h-8 w-8 object-contain"
                  unoptimized
                />
              </div>
            )}
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-bold">Tenant</p>
              <div className="flex items-center gap-1">
                <span className="text-xl md:text-2xl font-black tracking-tight">{tenant?.name || 'Sav'}</span>
                <span className="text-xl md:text-2xl font-light tracking-widest text-emerald-400">/Awards</span>
              </div>
            </div>
          </motion.div>
        </Link>

        {!isRifasPage && (
          <Link
            href={tenant?.slug ? `/${tenant.slug}/rifas` : '/'}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-200 transition-colors hover:border-emerald-400/50 hover:text-white"
          >
            Ver rifas
          </Link>
        )}
      </div>
    </header>
  );
}