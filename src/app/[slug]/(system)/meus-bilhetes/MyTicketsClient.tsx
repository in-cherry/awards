'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Gift, X, Trophy, Loader2, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TrustBadges } from '@/components/TrustBadges';

interface OpenedBox {
  id: string;
  boxIndex: number;
  prizeId: string;
  prizeName: string;
}

interface PaymentData {
  id: string;
  amount: number;
  ticketCount: number;
  boxesGranted: number;
  createdAt: string;
  raffle: { id: string; title: string; mysteryBoxEnabled: boolean };
  tickets: string[];
  openedBoxes: OpenedBox[];
}

interface ClientData {
  cpf: string;
  name: string;
  payments: PaymentData[];
}

interface MyTicketsClientProps {
  slug: string;
  initialData: ClientData | null;
  notFound?: boolean;
}

function RedirectToLogin({ slug }: { slug: string }) {
  const router = useRouter();
  const { setIsLoginModalOpen, tenant } = useApp();

  React.useEffect(() => {
    // Sessao valida agora depende de cookie httpOnly no servidor.
    // Sem sessao, voltamos para a home do tenant e abrimos o login modal.
    setIsLoginModalOpen(true);
    router.replace(`/${slug}`);
  }, [router, slug, setIsLoginModalOpen]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 size={24} className="animate-spin text-emerald-500" />
          <p className="text-emerald-500 font-bold">Verificando autentição...</p>
        </div>
      </div>
      <div className="p-4 w-full max-w-2xl mx-auto">
        <Footer instagramUrl={tenant?.instagramUrl} telegramUrl={tenant?.telegramUrl} supportUrl={tenant?.supportUrl} />
      </div>
    </div>
  );
}

export function MyTicketsClient({ slug, initialData, notFound: cpfNotFound }: MyTicketsClientProps) {
  const { tenant } = useApp();
  const [payments, setPayments] = useState<PaymentData[]>(initialData?.payments ?? []);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [openingBox, setOpeningBox] = useState<string | null>(null); // paymentId:boxIndex
  const [boxResult, setBoxResult] = useState<{ paymentId: string; boxIndex: number; won: boolean; prizeName?: string } | null>(null);

  const toggleExpand = (id: string) => {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleOpenBox = useCallback(
    async (payment: PaymentData, boxIndex: number) => {
      const key = `${payment.id}:${boxIndex}`;
      if (openingBox) return;
      setOpeningBox(key);
      setBoxResult(null);

      try {
        const res = await fetch('/api/mystery-box/open', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId: payment.id, boxIndex }),
        });
        const data = await res.json();

        if (res.ok) {
          const openedBox = data.openedBox as
            | { id: string; boxIndex: number; prizeId: string; prizeName: string }
            | undefined;

          setBoxResult({
            paymentId: payment.id,
            boxIndex,
            won: data.won,
            prizeName: data.prize?.name,
          });

          if (openedBox) {
            setPayments((prev) =>
              prev.map((p) =>
                p.id === payment.id
                  ? {
                    ...p,
                    openedBoxes: [
                      ...p.openedBoxes.filter((box) => box.boxIndex !== openedBox.boxIndex),
                      openedBox,
                    ],
                  }
                  : p
              )
            );
          }
        }
      } finally {
        setOpeningBox(null);
        setTimeout(() => setBoxResult(null), 4000);
      }
    },
    [openingBox]
  );

  if (!initialData) {
    return <RedirectToLogin slug={slug} />;
  }

  if (cpfNotFound) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-black">CPF não encontrado</h1>
            <p className="text-gray-400 text-sm">
              Nenhum bilhete encontrado para este CPF nesta loja.
            </p>
          </div>
        </div>
        <div className="p-4 w-full max-w-2xl mx-auto">
          <Footer instagramUrl={tenant?.instagramUrl} telegramUrl={tenant?.telegramUrl} supportUrl={tenant?.supportUrl} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-10 space-y-6">
        {/* Result popup */}
        <AnimatePresence>
          {boxResult && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl px-6 py-4 shadow-2xl border text-center ${boxResult?.won
                ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                : 'bg-gray-700/50 border-white/10 text-gray-300'
                }`}
            >
              {boxResult?.won ? (
                <p className="font-black text-sm">
                  🏆 Você ganhou: <span className="text-white">{boxResult?.prizeName}</span>!
                </p>
              ) : (
                <p className="font-bold text-sm">Que pena! Desta vez não foi. Tente outra caixa!</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight">Meus Bilhetes</h2>
            <p className="text-gray-400 text-xs mt-0.5">{initialData.name}</p>
          </div>
          <div className="bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
              {payments.length} {payments.length === 1 ? 'Pedido' : 'Pedidos'}
            </p>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p>Nenhum bilhete encontrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => {
              const currentPaymentData = payments.find((p) => p.id === payment.id)!;

              return (
                <motion.div
                  key={payment.id}
                  layout
                  className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden"
                >
                  <div
                    onClick={() => toggleExpand(payment.id)}
                    className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-black text-white truncate max-w-[200px]">
                        {payment.raffle.title}
                      </p>
                      <p className="text-xs text-gray-400 font-medium">
                        {payment.ticketCount} bilhete{payment.ticketCount > 1 ? 's' : ''} •{' '}
                        {new Date(payment.createdAt).toLocaleDateString('pt-BR')} •{' '}
                        R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    {expanded.includes(payment.id) ? (
                      <ChevronUp size={20} className="text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-400 shrink-0" />
                    )}
                  </div>

                  <AnimatePresence>
                    {expanded.includes(payment.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5 bg-black/20"
                      >
                        <div className="p-6 space-y-6">
                          {/* Mystery Boxes */}
                          {payment.raffle.mysteryBoxEnabled && payment.boxesGranted > 0 && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Gift size={14} className="text-purple-400" />
                                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
                                  Caixas Misteriosas ({currentPaymentData.openedBoxes.length}/{payment.boxesGranted} abertas)
                                </p>
                              </div>
                              <div className="grid grid-cols-4 gap-3">
                                {Array.from({ length: payment.boxesGranted }).map((_, idx) => {
                                  const opened = currentPaymentData.openedBoxes.find((b) => b.boxIndex === idx);
                                  const isOpening = openingBox === `${payment.id}:${idx}`;

                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => !opened && handleOpenBox(currentPaymentData, idx)}
                                      disabled={!!opened || !!openingBox}
                                      className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border-2 transition-all text-[10px] font-black ${opened
                                        ? opened.prizeName
                                          ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500'
                                          : 'bg-gray-500/20 border-gray-500/50 text-gray-500'
                                        : isOpening
                                          ? 'bg-purple-500/30 border-purple-500/50 text-purple-400'
                                          : 'bg-purple-500/20 border-purple-500/50 text-purple-400 hover:scale-105 hover:bg-purple-500/30 cursor-pointer'
                                        }`}
                                    >
                                      {isOpening ? (
                                        <Loader2 size={20} className="animate-spin" />
                                      ) : opened ? (
                                        opened.prizeName ? (
                                          <Gift size={20} />
                                        ) : (
                                          <X size={20} />
                                        )
                                      ) : (
                                        <Gift size={20} className="animate-pulse" />
                                      )}
                                      <span>{idx + 1}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Prêmios ganhos */}
                              {currentPaymentData.openedBoxes.some((b) => b.prizeName) && (
                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-start gap-3">
                                  <Trophy size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-1">
                                      Prêmios Conquistados
                                    </p>
                                    <div className="space-y-1">
                                      {currentPaymentData.openedBoxes
                                        .filter((b) => b.prizeName)
                                        .map((box) => (
                                          <p key={box.id} className="text-xs font-bold text-white">
                                            {box.prizeName}
                                          </p>
                                        ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Números */}
                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                              Seus Números ({payment.tickets.length})
                            </p>
                            {/* Para rifas com muitos números, limitar exibição */}
                            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                              {payment.tickets.slice(0, 200).map((num) => (
                                <div
                                  key={num}
                                  className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-emerald-400"
                                >
                                  {num}
                                </div>
                              ))}
                              {payment.tickets.length > 200 && (
                                <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-gray-500">
                                  +{payment.tickets.length - 200} mais
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <div className="max-w-2xl mx-auto px-4 pb-8"><TrustBadges /><Footer instagramUrl={tenant?.instagramUrl} telegramUrl={tenant?.telegramUrl} supportUrl={tenant?.supportUrl} /></div>
    </div>
  );
}
