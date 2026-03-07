"use client";

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { motion } from 'motion/react';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { PurchaseModal } from '@/components/Modals/PurchaseModal';
import { LoginModal } from '@/components/Modals/LoginModal';
import { MysteryBoxModal } from '@/components/Modals/MysteryBoxModal';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function TicketSelector() {
  const { raffle, ticketCount, setTicketCount } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!raffle) return null;

  const handleIncrease = () => {
    setTicketCount(prev => prev + 1);
  };

  const handleDecrease = () => {
    setTicketCount(prev => Math.max(raffle.minNumbers, prev - 1));
  };

  const total = ticketCount * raffle.price;

  return (
    <motion.div variants={itemVariants} className="bg-emerald-500 rounded-3xl p-6 text-center">
      <h3 className="text-xl font-black text-white mb-4">Comprar Números</h3>

      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={handleDecrease}
          disabled={ticketCount <= raffle.minNumbers}
          className="bg-white/20 rounded-full p-3 disabled:opacity-50"
        >
          <Minus size={20} className="text-white" />
        </button>

        <div className="bg-white/20 rounded-xl px-6 py-3">
          <span className="text-2xl font-bold text-white">{ticketCount}</span>
        </div>

        <button
          onClick={handleIncrease}
          className="bg-white/20 rounded-full p-3"
        >
          <Plus size={20} className="text-white" />
        </button>
      </div>

      <p className="text-white/80 mb-4">
        Total: R$ {total.toFixed(2)}
      </p>

      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-white text-emerald-500 font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
      >
        <ShoppingCart size={20} />
        Comprar Agora
      </button>

      <PurchaseModal />
      <LoginModal />
      <MysteryBoxModal />
    </motion.div>
  );
}