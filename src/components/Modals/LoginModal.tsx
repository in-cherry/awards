"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, Mail } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'next/navigation';
import { saveSession } from '@/lib/session';

export function LoginModal() {
  const {
    isLoginModalOpen, setIsLoginModalOpen,
    loginCpf, setLoginCpf,
    loginCpfError, setLoginCpfError,
    loginEmail, setLoginEmail,
    loginEmailError, setLoginEmailError,
    isLoginStepEmail, setIsLoginStepEmail,
    loginUser, setLoginUser,
    setUser,
    tenant
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

  const handleLoginCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setLoginCpf(formatted);
    if (loginCpfError) setLoginCpfError('');
  };

  const handleLoginEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginEmail(e.target.value.trim().toLowerCase());
    if (loginEmailError) setLoginEmailError('');
  };

  const handleLoginCpfSubmit = async () => {
    const cleanCpf = loginCpf.replace(/\D/g, '');
    if (!validateCPF(cleanCpf)) {
      setLoginCpfError('CPF inválido.');
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
        setLoginUser(data.client);
        setIsLoginStepEmail(true);
        setLoginCpfError('');
      } else {
        setLoginCpfError('Usuário não encontrado. Faça seu primeiro pedido para criar uma conta.');
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      setLoginCpfError('Erro ao verificar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginEmailSubmit = async () => {
    const currentEmail = loginEmail.trim().toLowerCase();
    if (!currentEmail || !currentEmail.includes('@')) {
      setLoginEmailError('Email inválido.');
      return;
    }

    if (loginUser?.cpf) {
      setLoading(true);
      try {
        const response = await fetch('/api/client/session/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tenantSlug: tenant?.slug,
            cpf: loginUser.cpf,
            email: currentEmail,
          }),
        });

        const data = await response.json();
        if (!response.ok || !data?.success) {
          setLoginEmailError(data?.error || 'Falha ao autenticar sessão.');
          return;
        }

        const userData = {
          name: data.client.name,
          email: data.client.email,
          phone: data.client.phone,
          cpf: data.client.cpf,
        };
        setUser(userData);
        saveSession(userData);
        setIsLoginModalOpen(false);
        setLoginEmailError('');
        router.push(`/${tenant?.slug}/meus-bilhetes`);
      } catch (error) {
        console.error('Erro ao autenticar sessão do cliente:', error);
        setLoginEmailError('Erro ao autenticar sessão. Tente novamente.');
      } finally {
        setLoading(false);
      }
    } else {
      setLoginEmailError('Sessão de login inválida. Recomece o login.');
    }
  };

  return (
    <AnimatePresence>
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLoginModalOpen(false)}
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
                <h2 className="text-xl font-black font-display tracking-tight">
                  {isLoginStepEmail ? `Ola, ${loginUser.name.split(' ')[0]}!` : 'Buscar Bilhetes'}
                </h2>
                <button
                  onClick={() => setIsLoginModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {!isLoginStepEmail ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Digite seu CPF</label>
                    <input
                      type="text"
                      value={loginCpf}
                      onChange={handleLoginCpfChange}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className={`w-full bg-white/5 border ${loginCpfError ? 'border-red-500' : 'border-white/10'} rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors font-mono`}
                    />
                    {loginCpfError && <p className="text-xs text-red-500 font-bold">{loginCpfError}</p>}
                  </div>
                  <button
                    onClick={handleLoginCpfSubmit}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Continuar <ChevronRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Confirme seu Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={handleLoginEmailChange}
                        placeholder="seu@email.com"
                        className={`w-full bg-white/5 border ${loginEmailError ? 'border-red-500' : 'border-white/10'} rounded-2xl px-4 py-3 pl-12 outline-none focus:border-emerald-500 transition-colors`}
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    </div>
                    {loginEmailError && <p className="text-xs text-red-500 font-bold">{loginEmailError}</p>}
                  </div>
                  <button
                    onClick={handleLoginEmailSubmit}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Ver Meus Bilhetes <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setIsLoginStepEmail(false);
                      setLoginEmail('');
                      setLoginEmailError('');
                    }}
                    className="w-full text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest py-2"
                  >
                    Voltar
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
