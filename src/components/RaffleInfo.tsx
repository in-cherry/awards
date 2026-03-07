"use client";

import { useApp } from '@/contexts/AppContext';
import { motion } from 'motion/react';
import { Calendar, Users, Trophy } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function RaffleInfo() {
  const { raffle } = useApp();

  if (!raffle) return null;

  return (
    <motion.div variants={itemVariants} className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 space-y-4">
      <div className="text-center">
        {raffle.bannerUrl && (
          <img
            src={raffle.bannerUrl}
            alt={raffle.title}
            className="w-full max-w-md mx-auto rounded-2xl mb-4"
          />
        )}
        <h2 className="text-2xl font-black text-white mb-2">{raffle.title}</h2>
        {raffle.description && (
          <p className="text-gray-300 text-sm">{raffle.description}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-white/5 rounded-xl p-4">
          <Trophy className="mx-auto mb-2 text-emerald-500" size={20} />
          <p className="text-xs text-gray-400 uppercase tracking-wide">Valor</p>
          <p className="text-lg font-bold text-white">
            R$ {raffle.price.toFixed(2)}
          </p>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <Users className="mx-auto mb-2 text-blue-500" size={20} />
          <p className="text-xs text-gray-400 uppercase tracking-wide">Mínimo</p>
          <p className="text-lg font-bold text-white">
            {raffle.minNumbers}
          </p>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <Calendar className="mx-auto mb-2 text-purple-500" size={20} />
          <p className="text-xs text-gray-400 uppercase tracking-wide">Status</p>
          <p className="text-lg font-bold text-white capitalize">
            {raffle.status.toLowerCase()}
          </p>
        </div>
      </div>
    </motion.div>
  );
}