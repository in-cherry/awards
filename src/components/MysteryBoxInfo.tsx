"use client";

import { useApp } from '@/contexts/AppContext';
import { motion } from 'motion/react';
import { Gift, Sparkles, Star } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function MysteryBoxInfo() {
  const { raffle } = useApp();

  if (!raffle?.mysteryBoxEnabled && raffle?.status !== 'FINISHED') {
    return null;
  }

  return (
    <>
      {/* Mystery Box Promo Card */}
      {raffle.mysteryBoxEnabled && raffle.status !== 'FINISHED' && (
        <motion.section 
          variants={itemVariants}
          className="relative bg-gradient-to-br from-purple-900/40 to-indigo-900/40 backdrop-blur-md border border-purple-500/30 rounded-[32px] p-8 overflow-hidden group"
        >
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
                <h3 className="text-lg font-black font-display tracking-tight text-white uppercase">Caixa Misteriosa</h3>
                <p className="text-[10px] text-purple-300 font-bold uppercase tracking-widest">Prêmios extras para os sortudos</p>
              </div>
            </div>
            
            <p className="text-sm text-purple-200/90 leading-relaxed">
              🎁 <strong className="text-purple-100">Ganhe prêmios adicionais</strong> comprando bilhetes! 
              Quanto mais bilhetes, maiores as chances de abrir caixas misteriosas com prêmios incríveis.
            </p>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-purple-400/20">
              <p className="text-xs text-purple-200 text-center">
                ✨ <strong>Ativado!</strong> Suas compras podem render surpresas especiais
              </p>
            </div>
          </div>
        </motion.section>
      )}
    </>
  );
}