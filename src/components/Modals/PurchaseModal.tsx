"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, Phone, Mail, Calendar, User as UserIcon } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'next/navigation';
import { TransparentCheckout } from '@/components/TransparentCheckout';
import { saveSession } from '@/lib/session';

export function PurchaseModal() {
  const {
    isModalOpen, setIsModalOpen,
    isNewUser, setIsNewUser,
    formData, setFormData,
    cpf, setCpf,
    cpfError, setCpfError,
    phoneError, setPhoneError,
    setUser,
    user,
    tenant,
    raffle,
    ticketCount,
    isCheckoutModalOpen, setIsCheckoutModalOpen,
    checkoutPaymentData, setCheckoutPaymentData,
  } = useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const validateCPF = (cpfValue: string) => {
    const cleanCpf = cpfValue.replace(/\D/g, '');
    if (cleanCpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleanCpf)) return false;

    let sum = 0;
    let rest;
    for (let i = 1; i <= 9; i++) sum = sum + parseInt(cleanCpf.substring(i - 1, i)) * (11 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cleanCpf.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) sum = sum + parseInt(cleanCpf.substring(i - 1, i)) * (12 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cleanCpf.substring(10, 11))) return false;

    return true;
  };

  const formatCPF = (value: string) => {
    const cleanValue = value.replace(/\D/g, '').substring(0, 11);
    let formatted = cleanValue;
    if (cleanValue.length > 3) {
      formatted = `${cleanValue.substring(0, 3)}.${cleanValue.substring(3)}`;
    }
    if (cleanValue.length > 6) {
      formatted = `${formatted.substring(0, 7)}.${cleanValue.substring(6)}`;
    }
    if (cleanValue.length > 9) {
      formatted = `${formatted.substring(0, 11)}-${cleanValue.substring(9)}`;
    }
    return formatted;
  };

  const formatPhone = (value: string) => {
    const cleanValue = value.replace(/\D/g, '').substring(0, 11);
    let formatted = cleanValue;
    if (cleanValue.length > 0) {
      formatted = `(${cleanValue.substring(0, 2)}`;
    }
    if (cleanValue.length > 2) {
      formatted = `${formatted}) ${cleanValue.substring(2, 7)}`;
    }
    if (cleanValue.length > 7) {
      formatted = `${formatted}-${cleanValue.substring(7)}`;
    }
    return formatted;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
    if (cpfError) setCpfError('');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'phone' | 'confirmPhone') => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({ ...prev, [field]: formatted }));
    if (phoneError) setPhoneError('');
  };

  const handleCpfSubmit = async () => {
    const cleanCpf = cpf.replace(/\D/g, '');

    if (!validateCPF(cleanCpf)) {
      setCpfError('CPF inválido. Verifique os números informados.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/client/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cpf: cleanCpf,
          tenantSlug: tenant?.slug
        }),
      });

      const data = await response.json();

      if (data.exists) {
        setIsNewUser(true);
        setFormData(prev => ({
          ...prev,
          name: data.client?.name ?? prev.name,
          email: '',
          phone: '',
          confirmPhone: '',
        }));
      } else {
        setIsNewUser(true);
      }
    } catch (error) {
      console.error('Erro ao verificar cliente:', error);
      setCpfError('Erro ao verificar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (isNewUser) {
      if (!formData.name.trim()) {
        setPhoneError('Por favor, informe o nome completo.');
        return;
      }
      if (!formData.email || !formData.email.includes('@')) {
        setPhoneError('Por favor, informe um e-mail válido.');
        return;
      }
      if (formData.phone !== formData.confirmPhone) {
        setPhoneError('Os números de telefone não coincidem.');
        return;
      }
      if (formData.phone.replace(/\D/g, '').length < 10) {
        setPhoneError('Telefone inválido.');
        return;
      }
    }

    if (!raffle) {
      setPhoneError('Error: Rifa não encontrada.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/payments/pix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: tenant?.slug,
          raffleId: raffle.id,
          ticketCount: ticketCount,
          client: {
            name: isNewUser ? formData.name : user?.name || '',
            email: isNewUser ? formData.email : user?.email || '',
            phone: isNewUser ? formData.phone.replace(/\D/g, '') : user?.phone?.replace(/\D/g, '') || '',
            cpf: cpf.replace(/\D/g, '')
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Salvar dados do usuário no contexto e na session
        if (isNewUser) {
          const userData = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            cpf: cpf
          };
          setUser(userData);
          saveSession(userData);
        }

        // Salvar dados do pagamento e mostrar checkout
        setCheckoutPaymentData({
          paymentId: data.paymentId,
          qrCode: data.qrCode,
          qrCodeBase64: data.qrCodeBase64,
          amount: data.amount
        });

        setIsModalOpen(false);
        setIsCheckoutModalOpen(true);
      } else {
        setPhoneError(data.error || 'Erro ao processar pagamento.');
      }
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      setPhoneError('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
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
                <h2 className="text-xl font-black font-display tracking-tight">Identificação</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {isNewUser === null ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Digite seu CPF</label>
                    <input
                      type="text"
                      value={cpf}
                      onChange={handleCpfChange}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className={`w-full bg-white/5 border ${cpfError ? 'border-red-500' : 'border-white/10'} rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors font-mono`}
                    />
                    {cpfError && <p className="text-xs text-red-500 font-bold">{cpfError}</p>}
                  </div>
                  <button
                    onClick={handleCpfSubmit}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Continuar <ChevronRight size={16} />
                  </button>
                </div>
              ) : isNewUser ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nome Completo</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 pl-12 outline-none focus:border-emerald-500 transition-colors"
                      />
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">E-mail</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 pl-12 outline-none focus:border-emerald-500 transition-colors"
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Data de Nascimento</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.birthDate}
                        onChange={e => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 pl-12 outline-none focus:border-emerald-500 transition-colors"
                      />
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Telefone / WhatsApp</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={e => handlePhoneChange(e, 'phone')}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 pl-12 outline-none focus:border-emerald-500 transition-colors font-mono"
                      />
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Confirme seu Telefone</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.confirmPhone}
                        onChange={e => handlePhoneChange(e, 'confirmPhone')}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        className={`w-full bg-white/5 border ${phoneError ? 'border-red-500' : 'border-white/10'} rounded-2xl px-4 py-3 pl-12 outline-none focus:border-emerald-500 transition-colors font-mono`}
                      />
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    </div>
                    {phoneError && <p className="text-xs text-red-500 font-bold">{phoneError}</p>}
                  </div>
                  <button
                    onClick={handleConfirm}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Confirmar Cadastro <ChevronRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center space-y-2">
                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                      <UserIcon size={24} className="text-white" />
                    </div>
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Bem-vindo de volta!</p>
                    <h3 className="text-xl font-black text-white">{cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4')}</h3>
                  </div>
                  <button
                    onClick={handleConfirm}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Continuar como {cpf.substring(0, 3)}.*** <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setIsNewUser(null);
                      setCpf('');
                    }}
                    className="w-full text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest py-2"
                  >
                    Não sou eu / Trocar CPF
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutModalOpen && checkoutPaymentData && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCheckoutModalOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md"
          >
            <TransparentCheckout
              paymentData={checkoutPaymentData}
              onClose={() => setIsCheckoutModalOpen(false)}
              onPaymentComplete={() => {
                setIsCheckoutModalOpen(false);
                // Redirect to success page or update UI
              }}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
