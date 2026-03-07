"use client";

import React from 'react';
import { motion } from 'motion/react';
import { Check, MessageCircle, Send, Instagram, Info, ChevronRight } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function RaffleInfo() {
  const { raffle } = useApp();

  if (!raffle) return null;

  return (
    <>
      {/* Hero Image */}
      <motion.div 
        variants={itemVariants}
        className="relative rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 group"
      >
        {raffle.bannerUrl ? (
          <>
            <img
              src={raffle.bannerUrl}
              alt={raffle.title}
              className="w-full aspect-video object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-60" />
            <div className="absolute bottom-6 left-6">
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="inline-block bg-emerald-500/20 backdrop-blur-md px-6 py-2 rounded-full border border-emerald-500/30 group-hover:scale-105 transition-transform"
              >
                <p className="text-sm font-black tracking-[0.2em] text-emerald-400 uppercase">R$ {raffle.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </motion.div>
            </div>
          </>
        ) : (
          <div className="w-full aspect-video bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black font-display tracking-tight text-white">{raffle.title}</h2>
              <p className="text-emerald-400 font-bold">R$ {raffle.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Action Buttons */}
      <motion.div variants={itemVariants} className="flex gap-3 justify-center">
        <button className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 px-4 py-2 rounded-xl text-[10px] font-black transition-all active:scale-95 cursor-pointer">
          <MessageCircle size={14} /> WHATSAPP
        </button>
        <button className="flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/20 px-4 py-2 rounded-xl text-[10px] font-black transition-all active:scale-95 cursor-pointer">
          <Send size={14} /> TELEGRAM
        </button>
        <button className="flex items-center gap-2 bg-pink-500/10 hover:bg-pink-500 text-pink-400 hover:text-white border border-pink-500/20 px-4 py-2 rounded-xl text-[10px] font-black transition-all active:scale-95 cursor-pointer">
          <Instagram size={14} /> INSTAGRAM
        </button>
      </motion.div>

      {/* Description */}
      <motion.section variants={itemVariants} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 space-y-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Info size={40} />
        </div>
        <h2 className="text-xs font-black tracking-[0.2em] text-emerald-400 uppercase flex items-center gap-2">
          <ChevronRight size={14} /> Descrição / Regulamento
        </h2>
        
        <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
          {raffle.description ? (
            <p>{raffle.description}</p>
          ) : (
            <div className="space-y-3">
              <p>🎯 <strong className="text-white">COMO PARTICIPAR:</strong></p>
              <ul className="space-y-2 ml-4 text-xs">
                <li className="flex items-start gap-2">
                  <Check size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  Escolha a quantidade de números que deseja comprar
                </li>
                <li className="flex items-start gap-2">
                  <Check size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  Preencha seus dados e efetue o pagamento via PIX
                </li>
                <li className="flex items-start gap-2">
                  <Check size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  Receba seus números por WhatsApp após confirmação do pagamento
                </li>
                <li className="flex items-start gap-2">
                  <Check size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  Aguarde o sorteio e boa sorte! 🍀
                </li>
              </ul>
              
              <p className="text-[10px] text-gray-500 pt-4 border-t border-white/5">
                ⚖️ Sorteio será realizado conforme a Lei Federal nº 5.768/71. 
                Todos os participantes devem ser maiores de 18 anos.
              </p>
            </div>
          )}
        </div>
      </motion.section>
    </>
  );
}
