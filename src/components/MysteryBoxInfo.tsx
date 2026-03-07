"use client";

import { useApp } from '@/contexts/AppContext';
import { motion } from 'motion/react';
import { Gift } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function MysteryBoxInfo() {
  const { raffle } = useApp();

  if (!raffle?.mysteryBoxEnabled || !raffle.mysteryBoxConfig) return null;

  const config = raffle.mysteryBoxConfig as any;

  return (
    <motion.div variants={itemVariants} className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl p-6">
      <div className="text-center mb-4">
        <Gift className="mx-auto mb-2 text-purple-400" size={32} />
        <h3 className="text-xl font-black text-white">Caixa Misteriosa</h3>
        <p className="text-sm text-gray-300">Ganhe prêmios extras!</p>
      </div>

      {config.rules && (
        <div className="space-y-2">
          {config.rules.map((rule: any, index: number) => (
            <div key={index} className="bg-white/10 rounded-xl p-3 flex justify-between items-center">
              <span className="text-white text-sm">
                {rule.minTickets} números
              </span>
              <span className="text-purple-400 font-bold text-sm">
                {rule.boxes} caixa{rule.boxes > 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}