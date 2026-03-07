'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, Clock, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PaymentClientProps {
  slug: string;
  paymentId: string;
  initialStatus: string;
  amount: number;
  ticketCount: number;
  qrCode: string;
  qrCodeBase64: string;
  clientCpf: string;
}

export function PaymentClient({
  slug,
  paymentId,
  initialStatus,
  amount,
  ticketCount,
  qrCode,
  qrCodeBase64,
  clientCpf,
}: PaymentClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/payments/${paymentId}/status`);
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data.status);
    } catch {
      // silently ignore poll errors
    }
  }, [paymentId]);

  // Polling a cada 5 segundos enquanto pendente
  useEffect(() => {
    if (status !== 'PENDING') return;
    intervalRef.current = setInterval(pollStatus, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status, pollStatus]);

  // Redirecionar para my-tickets após aprovação
  useEffect(() => {
    if (status !== 'APPROVED') return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(`/${slug}/my-tickets${clientCpf ? `?cpf=${clientCpf}` : ''}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, slug, clientCpf, router]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // fallback — not critical
    }
  }

  const isApproved = status === 'APPROVED';

  return (
    <div className="min-h-screen font-sans selection:bg-emerald-500/30 bg-[#0f172a] text-white overflow-x-hidden">
      <header className="py-6 px-4 border-b border-white/5">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-sm font-black tracking-[0.2em] text-emerald-400 uppercase">Winzy</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {isApproved ? (
            <motion.div
              key="approved"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden text-center"
            >
              <div className="p-12 space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                  className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30"
                >
                  <CheckCircle2 size={48} className="text-white" />
                </motion.div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black tracking-tight text-white">Pagamento Aprovado!</h2>
                  <p className="text-emerald-400 font-bold">
                    {ticketCount} bilhete{ticketCount > 1 ? 's' : ''} reservado{ticketCount > 1 ? 's' : ''}!
                  </p>
                  <p className="text-gray-400 text-sm mt-4">
                    Redirecionando para seus bilhetes em{' '}
                    <span className="text-white font-black">{countdown}s</span>...
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="pending"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden text-center"
            >
              <div className="p-8 space-y-8">
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-yellow-400">
                    <Clock size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">Aguardando Pagamento</span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-white">PIX Gerado!</h2>
                  <p className="text-sm text-gray-400">
                    Escaneie o QR Code ou copie o código abaixo para pagar.
                  </p>
                </div>

                {/* QR Code */}
                <div className="bg-white p-4 rounded-2xl w-56 h-56 mx-auto shadow-inner flex items-center justify-center">
                  {qrCodeBase64 ? (
                    <img
                      src={`data:image/png;base64,${qrCodeBase64}`}
                      alt="QR Code PIX"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-400 text-sm">QR Code indisponível</div>
                  )}
                </div>

                {/* Valor */}
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl px-6 py-4">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Valor a pagar</p>
                  <p className="text-3xl font-black text-emerald-400">
                    R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Copia e cola */}
                <div className="space-y-3">
                  <div className="bg-black/20 rounded-2xl p-4 flex items-center justify-between gap-4 border border-white/5">
                    <code className="text-xs text-emerald-400 font-mono truncate flex-1 text-left">
                      {qrCode || 'Código indisponível'}
                    </code>
                    <button
                      onClick={handleCopy}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Copiar código PIX"
                    >
                      {copied ? (
                        <Check size={16} className="text-emerald-400" />
                      ) : (
                        <Copy size={16} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                  {copied && (
                    <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                      Código copiado!
                    </p>
                  )}
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-center gap-2">
                    <RefreshCw size={10} className="animate-spin" />
                    Verificando pagamento automaticamente...
                  </p>
                </div>
              </div>

              <div className="bg-black/20 p-6">
                <p className="text-xs text-gray-500 font-medium">
                  Pedido #{paymentId.slice(-8).toUpperCase()} •{' '}
                  {ticketCount} bilhete{ticketCount > 1 ? 's' : ''} •{' '}
                  R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
