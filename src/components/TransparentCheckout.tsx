"use client";

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, RefreshCw, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { getSession } from '@/lib/session';

interface TransparentCheckoutProps {
  paymentData: {
    paymentId: string;
    qrCode: string;
    qrCodeBase64: string;
    amount: number;
    expiresAt?: string;
  };
  onPaymentComplete?: () => void;
  onClose?: () => void;
}

export function TransparentCheckout({ paymentData, onPaymentComplete, onClose }: TransparentCheckoutProps) {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'cancelled'>('pending');
  const router = useRouter();
  const { tenant, user, setIsLoginModalOpen } = useApp();

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(paymentData.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const checkPaymentStatus = async () => {
    setChecking(true);
    try {
      const response = await fetch(`/api/payments/${paymentData.paymentId}/status`);
      const data = await response.json();

      if (data.status === 'APPROVED') {
        setPaymentStatus('approved');
        setTimeout(() => {
          onPaymentComplete?.();
          const session = getSession();
          if (session?.cpf) {
            router.push(`/${tenant?.slug}/meus-bilhetes`);
          } else {
            setIsLoginModalOpen(true);
          }
        }, 2000);
      } else if (data.status === 'CANCELLED') {
        setPaymentStatus('cancelled');
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
    } finally {
      setChecking(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  // Auto-check payment status periodically
  useEffect(() => {
    const interval = setInterval(checkPaymentStatus, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (paymentStatus === 'approved') {
    return (
      <div className="bg-white/5 backdrop-blur-md border border-emerald-500/30 rounded-3xl p-8 space-y-6 max-w-md mx-auto">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-black text-emerald-400 uppercase tracking-tight">Pagamento Aprovado!</h3>
          <p className="text-sm text-gray-300">Redirecionando para seus bilhetes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 space-y-6 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-black text-white uppercase tracking-tight">Finalizar Pagamento</h3>
        <p className="text-2xl font-black text-emerald-400">{formatCurrency(paymentData.amount)}</p>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <p className="text-xs text-yellow-500 font-bold uppercase tracking-widest">Aguardando pagamento</p>
        </div>
      </div>

      <motion.div className="space-y-6">
        <div className="bg-white p-4 rounded-2xl mx-auto w-fit">
          <img
            src={`data:image/png;base64,${paymentData.qrCodeBase64}`}
            alt="QR Code PIX"
            className="w-48 h-48 mx-auto"
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-black text-white text-center uppercase tracking-tight">
            Ou copie o código PIX:
          </p>
          <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="flex-1 text-xs text-gray-300 break-all font-mono leading-relaxed">
                {paymentData.qrCode}
              </div>
              <button
                onClick={handleCopyPix}
                className="flex-shrink-0 w-10 h-10 bg-emerald-500 hover:bg-emerald-400 rounded-lg flex items-center justify-center transition-all"
              >
                {copied ? (
                  <Check size={16} className="text-white" />
                ) : (
                  <Copy size={16} className="text-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center space-y-2">
          <p className="text-xs text-emerald-400 font-black uppercase tracking-widest">✅ Pagamento automático</p>
          <p className="text-xs text-gray-400">
            Após o pagamento, seus bilhetes serão liberados automaticamente
          </p>
        </div>
      </motion.div>

      <div className="flex gap-3">
        {onClose && (
          <button
            onClick={onClose}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all border border-white/10"
          >
            Voltar
          </button>
        )}
        <button
          onClick={checkPaymentStatus}
          disabled={checking}
          className="flex-1 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
        >
          <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
          {checking ? 'Verificando...' : 'Atualizar'}
        </button>
      </div>
    </div>
  );
}