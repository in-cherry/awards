"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, Trophy } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function Ranking() {
  const { raffle, tenant } = useApp();
  const [rankingList, setRankingList] = useState<any[]>([]);

  useEffect(() => {
    async function fetchRanking() {
      if (!tenant?.slug) return;
      try {
        const res = await fetch(`/api/ranking/${tenant.slug}`);
        if (res.ok) {
          const data = await res.json();
          setRankingList(data.ranking);
        }
      } catch (e) {
        console.error('Failed to fetch ranking', e);
      }
    }
    fetchRanking();
  }, [tenant?.slug]);

  // For now, always show ranking - in real app check raffle.rankingEnabled when implemented
  if (!raffle) return null;

  const top3Prizes = [
    'R$ 500,00 no PIX',
    'R$ 300,00 no PIX',
    'R$ 200,00 no PIX'
  ];

  return (
    <motion.section variants={itemVariants} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-xs font-black tracking-[0.2em] text-gray-400 uppercase flex items-center justify-center gap-2">
          <Users size={14} /> Classificação dos Colaboradores
        </h2>
        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Prêmios para os maiores compradores</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-white/5">
        {top3Prizes.map((prize, idx) => (
          <div key={idx} className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-yellow-500 text-white' : idx === 1 ? 'bg-gray-300 text-gray-900' : 'bg-orange-500 text-white'}`}>
              {idx + 1}º
            </div>
            <p className="text-[10px] font-black text-white uppercase tracking-tight">{prize}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {rankingList.slice(0, 3).map((user) => (
          <motion.div
            key={user.rank}
            whileHover={{ y: -5 }}
            className="flex flex-col items-center text-center space-y-3"
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-lg border-2 ${user.rank === 1
              ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
              : user.rank === 2
                ? 'bg-gray-300/20 border-gray-300 text-gray-300'
                : 'bg-orange-500/20 border-orange-500 text-orange-400'
              }`}>
              {user.rank}º
            </div>
            <div>
              <p className="text-sm font-black text-white">{user.name}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                {user.ticketCount} bilhetes
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}