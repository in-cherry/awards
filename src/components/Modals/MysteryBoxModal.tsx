"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gift, Sparkles, Trophy } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export function MysteryBoxModal() {
  const {
    isMysteryBoxModalOpen, setIsMysteryBoxModalOpen,
    boxOpeningStatus, setBoxOpeningStatus,
    boxPrize, setBoxPrize,
    currentBoxTicket,
    tenant
  } = useApp();

  useEffect(() => {
    if (isMysteryBoxModalOpen && boxOpeningStatus === 'opening' && currentBoxTicket) {
      const timer = setTimeout(async () => {
        try {
          const response = await fetch('/api/mystery-box/open', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentId: currentBoxTicket.paymentId,
              boxIndex: currentBoxTicket.boxIndex || 0,
              tenantSlug: tenant?.slug
            }),
          });

          const data = await response.json();

          if (data.success) {
            if (data.won && data.prize) {
              setBoxPrize(`${data.prize.name}`);
            } else {
              setBoxPrize(null);
            }
          } else {
            setBoxPrize(null);
          }
        } catch (error) {
          console.error('Erro ao abrir caixa misteriosa:', error);
          setBoxPrize(null);
        }

        setBoxOpeningStatus('opened');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isMysteryBoxModalOpen, boxOpeningStatus, currentBoxTicket, tenant, setBoxPrize, setBoxOpeningStatus]);

  return (
    <AnimatePresence>
      {isMysteryBoxModalOpen && (
        <div className="fixed inset-0 z-65 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMysteryBoxModalOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-[#0f172a] border border-white/10 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl p-8 text-center space-y-8"
          >
            <button
              onClick={() => setIsMysteryBoxModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>

            {boxOpeningStatus === 'opening' && (
              <div className="py-12 space-y-8">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, -5, 5, -5, 5, 0]
                  }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="w-32 h-32 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-purple-500/20"
                >
                  <Gift size={64} className="text-white" />
                </motion.div>
                <p className="text-xl font-black font-display tracking-tight animate-pulse">Abrindo sua caixa...</p>
              </div>
            )}

            {boxOpeningStatus === 'opened' && (
              <div className="py-8 space-y-8">
                {boxPrize ? (
                  <>
                    <motion.div
                      initial={{ scale: 0, rotate: 180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-yellow-500/20"
                    >
                      <Trophy size={64} className="text-white" />
                    </motion.div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black font-display tracking-tight text-yellow-400">PARABÉNS!</h3>
                      <p className="text-sm font-bold text-gray-300">Você encontrou um prêmio:</p>
                      <p className="text-xl font-black text-white uppercase tracking-widest">{boxPrize}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-32 h-32 bg-white/5 rounded-3xl mx-auto flex items-center justify-center border border-white/10"
                    >
                      <X size={64} className="text-gray-500" />
                    </motion.div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black font-display tracking-tight text-gray-400">Não foi dessa vez</h3>
                      <p className="text-sm font-bold text-gray-500">Tente a sorte na próxima caixa!</p>
                    </div>
                  </>
                )}
                <button
                  onClick={() => setIsMysteryBoxModalOpen(false)}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all active:scale-95"
                >
                  Fechar
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}


