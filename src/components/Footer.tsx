"use client";

import React from 'react';
import { motion } from 'motion/react';
import { Instagram, MessageCircle, LifeBuoy } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

type FooterProps = {
  instagramUrl?: string | null;
  telegramUrl?: string | null;
  supportUrl?: string | null;
};

export function Footer({ instagramUrl, telegramUrl, supportUrl }: FooterProps) {

  const links = [
    { label: 'Instagram', href: instagramUrl, icon: Instagram },
    { label: 'Telegram', href: telegramUrl, icon: MessageCircle },
    { label: 'Suporte', href: supportUrl, icon: LifeBuoy },
  ].filter((item) => typeof item.href === 'string' && item.href.length > 0);

  return (
    <motion.div variants={itemVariants} className="text-center py-4 mt-6">
      {links.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-200 transition-colors hover:border-emerald-400/60 hover:text-white"
              >
                <Icon size={14} />
                {item.label}
              </a>
            );
          })}
        </div>
      )}
      <p className="text-xs text-gray-500">
        &copy; 2026 Desenvolvido por <a href="https://winzy.com.br" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors font-bold">Winzy</a>. Todos os direitos reservados.
      </p>
    </motion.div>
  );
}