"use client";

import React from 'react';
import { motion } from 'motion/react';
import { Smartphone } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function Footer() {
  return (
    <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-4 group hover:border-emerald-500/30 transition-colors">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Método de Pagamento</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
            <Smartphone size={20} className="text-white" />
          </div>
          <span className="text-lg font-black font-display tracking-tighter">pix</span>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-4 group hover:border-blue-500/30 transition-colors">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sorteio Oficial</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
            <div className="grid grid-cols-2 gap-1">
              <div className="w-2 h-2 bg-white rounded-full" />
              <div className="w-2 h-2 bg-white rounded-full" />
              <div className="w-2 h-2 bg-white rounded-full" />
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          </div>
          <span className="text-[10px] font-black leading-tight uppercase tracking-tighter">Loterias<br /><span className="text-blue-400">CAIXA</span></span>
        </div>
      </div>

      <footer className="text-center py-8 text-gray-400 text-sm">
        <p>&copy; 2026 Desenvolvido por <a href="https://winzy.com.br" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Winzy</a>. Todos os direitos reservados.</p>
      </footer>
    </motion.div>
  );
}