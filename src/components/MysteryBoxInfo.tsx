"use client";

import { useApp } from '@/contexts/AppContext';
import { motion } from 'motion/react';
import { Gift, Sparkles, Star, Check, Lock } from 'lucide-react';
import { parseMysteryBoxConfig, getBoxesForTickets } from '@/lib/mystery-box';
import { useMemo } from 'react';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Mock prizes for now - in production this would come from database
const MOCK_MYSTERY_PRIZES = [
  { id: 1, name: 'R$ 500,00 no PIX', winner: 'MURILO OLIVEIRA SOUZA', isWon: true },
  { id: 2, name: 'iPhone 15 Pro', winner: 'MURILO OLIVEIRA SOUZA', isWon: true },
  { id: 3, name: 'R$ 1.000,00 no PIX', winner: null, isWon: false },
  { id: 4, name: 'PlayStation 5', winner: null, isWon: false }
];

export function MysteryBoxInfo() {
  const { raffle, ticketCount } = useApp();

  const mysteryBoxData = useMemo(() => {
    if (!raffle?.mysteryBoxEnabled) return null;

    const config = parseMysteryBoxConfig(raffle.mysteryBoxConfig);
    if (!config) return null;

    return {
      config,
      currentBoxes: getBoxesForTickets(ticketCount, config.rules),
      totalPrizes: MOCK_MYSTERY_PRIZES.length,
      wonPrizes: MOCK_MYSTERY_PRIZES.filter(p => p.isWon).length,
      availablePrizes: MOCK_MYSTERY_PRIZES.filter(p => !p.isWon).length
    };
  }, [raffle, ticketCount]);

  if (!raffle?.mysteryBoxEnabled || !mysteryBoxData) {
    return null;
  }

  const { config, currentBoxes, totalPrizes, wonPrizes, availablePrizes } = mysteryBoxData;

  return (
    <motion.section variants={itemVariants} className="space-y-6">
      {/* Mystery Box Info Card */}
      <div className="relative bg-gradient-to-br from-purple-900/40 to-indigo-900/40 backdrop-blur-md border border-purple-500/30 rounded-[32px] p-8 overflow-hidden group">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 blur-[80px] group-hover:bg-purple-500/30 transition-all" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-indigo-500/20 blur-[60px] group-hover:bg-indigo-500/30 transition-all" />

        {/* Floating particles */}
        <div className="absolute top-6 right-12 opacity-30">
          <Sparkles size={16} className="text-purple-300 animate-pulse" />
        </div>
        <div className="absolute bottom-8 right-6 opacity-40">
          <Star size={12} className="text-indigo-300 animate-bounce" style={{ animationDelay: '0.5s' }} />
        </div>
        <div className="absolute top-12 left-8 opacity-35">
          <Star size={14} className="text-purple-200 animate-bounce" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25"
            >
              <Gift size={28} className="text-white" />
            </motion.div>
            <div className="space-y-1">
              <h3 className="text-lg font-black font-display tracking-tight text-white uppercase">🎁 CAIXA MISTERIOSA</h3>
              <p className="text-[10px] text-purple-300 font-bold uppercase tracking-widest">Ganhe caixas ao comprar grandes quantidades e concorra a prêmios instantâneos!</p>
            </div>
          </div>

          {/* Mystery Box Rules Grid */}
          <div className="grid grid-cols-3 gap-4">
            {config.rules.map((rule, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center space-y-2 border border-purple-400/20">
                <div className="text-2xl font-black text-purple-300">{rule.minTickets}</div>
                <div className="text-[10px] text-purple-200 uppercase tracking-widest">números</div>
                <div className="text-lg font-black text-white">{rule.boxes}</div>
                <div className="text-[8px] text-purple-400 uppercase tracking-widest">
                  {rule.boxes === 1 ? 'caixa' : 'caixas'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Prizes Section */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white uppercase tracking-tight">🏆 PRÊMIOS DAS CAIXAS</h3>
          <div className="text-right">
            <div className="text-sm font-black text-emerald-400">{availablePrizes} DISPONÍVEIS</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest">{wonPrizes} ganhos de {totalPrizes} total</div>
          </div>
        </div>

        <div className="space-y-3">
          {MOCK_MYSTERY_PRIZES.map((prize, index) => (
            <div
              key={prize.id}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${prize.isWon
                  ? 'bg-gray-500/10 border-gray-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/20'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${prize.isWon ? 'bg-gray-500' : 'bg-emerald-500'
                  }`}>
                  {prize.isWon ? (
                    <Check size={16} className="text-white" />
                  ) : (
                    <Gift size={16} className="text-white" />
                  )}
                </div>
                <div>
                  <div className={`font-black text-sm ${prize.isWon ? 'text-gray-400' : 'text-white'}`}>
                    {prize.name}
                  </div>
                  {prize.winner && (
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest">
                      GANHADOR: {prize.winner}
                    </div>
                  )}
                </div>
              </div>
              <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${prize.isWon
                  ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                {prize.isWon ? 'GANHO' : 'DISPONÍVEL'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}