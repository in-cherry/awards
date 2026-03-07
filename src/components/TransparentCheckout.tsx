"use client";

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Smartphone, Copy, Check, ExternalLink } from 'lucide-react';

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

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(paymentData.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 space-y-6 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-black text-white uppercase tracking-tight">Finalizar Pagamento</h3>
        <p className="text-2xl font-black text-emerald-400">{formatCurrency(paymentData.amount)}</p>
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
          onClick={() => window.open(`/api/payments/${paymentData.paymentId}/status`, '_blank')}
          className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
        >
          <ExternalLink size={16} />
          Verificar
        </button>
      </div>
    </div>
  );
}