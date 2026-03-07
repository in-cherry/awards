"use client";

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { motion } from 'motion/react';
import { ShoppingCart, Plus, Minus, Gift } from 'lucide-react';
import { PurchaseModal } from '@/components/Modals/PurchaseModal';
import { LoginModal } from '@/components/Modals/LoginModal';
import { MysteryBoxModal } from '@/components/Modals/MysteryBoxModal';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function TicketSelector() {
  const { raffle, ticketCount, setTicketCount, setIsModalOpen, setIsNewUser, setCpf, setCpfError, setPhoneError, setFormData } = useApp();
  
  if (!raffle) return null;

  const handleQuantitySelect = (qty: number) => {
    setTicketCount(qty);
  };

  const handleIncrease = () => {
    setTicketCount(prev => prev + 1);
  };

  const handleDecrease = () => {
    setTicketCount(prev => Math.max(raffle.minNumbers, prev - 1));
  };

  const handleReserve = () => {
    setIsModalOpen(true);
    setIsNewUser(null);
    setCpf('');
    setCpfError('');
    setPhoneError('');
    setFormData({
      name: '',
      email: '',
      birthDate: '',
      phone: '',
      confirmPhone: ''
    });
  };

  const total = ticketCount * raffle.price;

  return (
    <motion.section variants={itemVariants} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 space-y-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
      
      <h2 className="text-center text-xs font-black tracking-[0.2em] text-gray-400 uppercase">Selecione a quantidade de bilhetes</h2>
      
      <div className="grid grid-cols-4 gap-3">
        {[1, 5, 10, 100].map((num) => (
          <button
            key={num}
            onClick={() => handleQuantitySelect(num)}
            className={`
              p-4 rounded-2xl border-2 transition-all text-center space-y-2 group
              ${ticketCount === num 
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                : 'border-white/10 bg-white/5 text-gray-400 hover:border-emerald-500/30 hover:bg-emerald-500/5'
              }
            `}
          >
            <p className="text-xs font-black uppercase tracking-wider">{num}</p>
            <p className="text-[10px] text-gray-500 group-hover:text-gray-400">
              {num === 1 ? 'bilhete' : 'bilhetes'}
            </p>
          </button>
        ))}
      </div>

      <div className="space-y-6">
        <div className="text-center space-y-2">
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Quantidade personalizada</p>
          <div className="flex items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDecrease}
              disabled={ticketCount <= raffle.minNumbers}
              className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-white/10"
            >
              <Minus size={20} className="text-white" />
            </motion.button>

            <div className="bg-white/10 rounded-2xl px-8 py-4 border border-white/10">
              <span className="text-3xl font-black text-white">{ticketCount}</span>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleIncrease}
              className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all border border-white/10"
            >
              <Plus size={20} className="text-white" />
            </motion.button>
          </div>
        </div>

        <div className="bg-black/20 rounded-2xl p-6 space-y-4 border border-white/5">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-gray-400">Valor por bilhete:</span>
            <span className="text-sm font-black text-white">R$ {raffle.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-gray-400">Quantidade:</span>
            <span className="text-sm font-black text-white">{ticketCount} {ticketCount === 1 ? 'bilhete' : 'bilhetes'}</span>
          </div>
          <div className="border-t border-white/5 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-black text-white">TOTAL:</span>
              <span className="text-2xl font-black text-emerald-400">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Mystery Box Bonus */}
        {raffle.mysteryBoxEnabled && (
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-4 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-purple-400">
              <Gift size={16} />
              <span className="text-xs font-black uppercase tracking-wider">BÔNUS CAIXA MISTERIOSA</span>
            </div>
            <p className="text-[10px] text-gray-400">
              Comprando {ticketCount} bilhetes você ganha chances de prêmios extras!
            </p>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleReserve}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-5 rounded-2xl shadow-lg shadow-emerald-500/20 uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <ShoppingCart size={20} />
          RESERVAR BILHETES
        </motion.button>
      </div>

      <PurchaseModal />
      <LoginModal />
      <MysteryBoxModal />
    </motion.section>
  );
}
