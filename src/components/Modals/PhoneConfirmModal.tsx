"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Phone, ChevronRight, ShieldCheck } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export function PhoneConfirmModal() {
  const {
    isPhoneConfirmModalOpen, setIsPhoneConfirmModalOpen,
    user,
    setCpf,
    setIsNewUser,
    setIsModalOpen,
    setPhoneError,
  } = useApp();

  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const formatPhone = (value: string) => {
    const clean = value.replace(/\D/g, '').substring(0, 11);
    let formatted = clean;
    if (clean.length > 0) formatted = `(${clean.substring(0, 2)}`;
    if (clean.length > 2) formatted = `${formatted}) ${clean.substring(2, 7)}`;
    if (clean.length > 7) formatted = `${formatted}-${clean.substring(7)}`;
    return formatted;
  };

  const handleConfirm = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    const userPhone = user?.phone?.replace(/\D/g, '') || '';

    if (!cleanPhone) {
      setError('Informe seu telefone.');
      return;
    }

    if (cleanPhone !== userPhone) {
      setError('Telefone incorreto. Tente novamente.');
      return;
    }

    // Telefone confirmado — pré-preenche dados e abre o PurchaseModal
    if (user?.cpf) {
      setCpf(user.cpf.replace(/\D/g, ''));
    }
    setIsNewUser(false);
    setPhoneError('');
    setIsPhoneConfirmModalOpen(false);
    setIsModalOpen(true);
    setPhone('');
    setError('');
  };

  const handleClose = () => {
    setIsPhoneConfirmModalOpen(false);
    setPhone('');
    setError('');
  };

  return (
    <AnimatePresence>
      {isPhoneConfirmModalOpen && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-[#0f172a] border border-white/10 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl"
          >
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black font-display tracking-tight">Confirmação</h2>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 text-center space-y-2">
                <ShieldCheck className="mx-auto text-emerald-400" size={28} />
                <p className="text-base font-black text-white">Olá, {user.name.split(' ')[0]}!</p>
                {user.cpf && (
                  <p className="text-sm font-bold text-gray-300">
                    CPF: ***.{user.cpf.replace(/\D/g, '').slice(3, 6)}.{user.cpf.replace(/\D/g, '').slice(6, 9)}-**
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  Confirme seu telefone para garantir que é você quem está comprando.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Telefone / WhatsApp
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => {
                      setPhone(formatPhone(e.target.value));
                      if (error) setError('');
                    }}
                    onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className={`w-full bg-white/5 border ${error ? 'border-red-500' : 'border-white/10'} rounded-2xl px-4 py-3 pl-12 outline-none focus:border-emerald-500 transition-colors font-mono`}
                  />
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                </div>
                {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
              </div>

              <button
                onClick={handleConfirm}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Confirmar e Comprar <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
