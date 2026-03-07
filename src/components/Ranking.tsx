"use client";

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Crown, Trophy, Medal, Award } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

type RankingEntry = {
  rank: number;
  name: string;
  ticketCount: number;
  color: string;
};

export function Ranking() {
  const { tenant } = useApp();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenant) {
      loadRanking();
    }
  }, [tenant]);

  const loadRanking = async () => {
    try {
      const response = await fetch(`/api/ranking/${tenant?.slug}`);
      const data = await response.json();

      if (data.success) {
        setRanking(data.ranking);
      } else {
        console.error('Erro ao carregar ranking:', data.error);
        setRanking([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
      setRanking([]);
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="text-yellow-500" size={20} />;
      case 2: return <Trophy className="text-slate-300" size={20} />;
      case 3: return <Medal className="text-orange-400" size={20} />;
      default: return <Award className="text-gray-400" size={20} />;
    }
  };

  return (
    <motion.div variants={itemVariants} className="bg-white/10 backdrop-blur-sm rounded-3xl p-6">
      <div className="text-center mb-4">
        <Crown className="mx-auto mb-2 text-yellow-500" size={32} />
        <h3 className="text-xl font-black text-white">Ranking</h3>
        <p className="text-sm text-gray-300">Os maiores compradores</p>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-4">
          <p>Carregando ranking...</p>
        </div>
      ) : ranking.length > 0 ? (
        <div className="space-y-3">
          {ranking.map((entry) => (
            <div
              key={entry.rank}
              className={`${entry.color} bg-opacity-20 rounded-xl p-4 flex items-center justify-between`}
            >
              <div className="flex items-center gap-3">
                {getRankIcon(entry.rank)}
                <div>
                  <p className="text-white font-bold text-sm">{entry.name}</p>
                  <p className="text-xs text-gray-300">#{entry.rank} Posição</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-white">{entry.ticketCount.toLocaleString()}</p>
                <p className="text-xs text-gray-300">números</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-4">
          <p>Nenhum dado de ranking disponível</p>
        </div>
      )}
    </motion.div>
  );
}