'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Minus, Plus, Gift, User, Phone, Mail, CreditCard, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MysteryBoxConfig } from '@/lib/types';
import { getBoxesForTickets, getNextBoxIncentive } from '@/lib/mystery-box';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useApp } from '@/contexts/AppContext';

interface RaffleData {
  id: string;
  slug?: string;
  title: string;
  price: number;
  minNumbers: number;
  totalNumbers: number;
  mysteryBoxEnabled: boolean;
  mysteryBoxConfig: MysteryBoxConfig | null;
}

interface CheckoutClientProps {
  slug: string;
  raffle: RaffleData;
}

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

export function CheckoutClient({ slug, raffle }: CheckoutClientProps) {
  const router = useRouter();
  const { tenant } = useApp();

  const [ticketCount, setTicketCount] = useState(raffle.minNumbers);
  const [form, setForm] = useState({ name: '', cpf: '', phone: '', email: '' });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const price = raffle.price;
  const totalPrice = ticketCount * price;
  const rules = raffle.mysteryBoxConfig?.rules ?? [];
  const winProbability = raffle.mysteryBoxConfig?.winProbability ?? 0;
  const boxes = raffle.mysteryBoxEnabled ? getBoxesForTickets(ticketCount, rules) : 0;
  const nextIncentive = raffle.mysteryBoxEnabled ? getNextBoxIncentive(ticketCount, rules) : null;

  const decrementTickets = () => {
    setTicketCount((prev) => Math.max(raffle.minNumbers, prev - 1));
  };

  const incrementTickets = () => {
    setTicketCount((prev) => Math.min(raffle.totalNumbers, prev + 1));
  };

  const validate = (): boolean => {
    const newErrors: Partial<typeof form> = {};
    if (!form.name.trim() || form.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    }
    const cpfDigits = form.cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      newErrors.cpf = 'CPF inválido';
    }
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      newErrors.phone = 'Telefone inválido';
    }
    if (!form.email.includes('@') || !form.email.includes('.')) {
      newErrors.email = 'E-mail inválido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handlePay() {
    if (!validate()) return;
    setLoading(true);
    setApiError('');

    try {
      const res = await fetch('/api/payments/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          raffleRef: raffle.slug ?? raffle.id,
          ticketCount,
          client: {
            name: form.name.trim(),
            cpf: form.cpf.replace(/\D/g, ''),
            phone: form.phone.replace(/\D/g, ''),
            email: form.email.trim().toLowerCase(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setApiError(data.error ?? 'Erro ao gerar pagamento');
        return;
      }

      router.push(`/${slug}/meus-bilhetes`);
    } catch {
      setApiError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen font-sans selection:bg-emerald-500/30 text-white overflow-x-hidden">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden"
        >
          {/* Título da rifa */}
          <div className="px-8 pt-8 pb-4 border-b border-white/5">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Participando de</p>
            <h2 className="font-black text-lg text-white leading-tight">{raffle.title}</h2>
          </div>

          <div className="p-8 space-y-8">
            {/* Dados pessoais */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Seus Dados</p>

              {[
                { key: 'name', label: 'Nome completo', icon: User, type: 'text', placeholder: 'João da Silva', transform: (v: string) => v },
                { key: 'cpf', label: 'CPF', icon: CreditCard, type: 'text', placeholder: '000.000.000-00', transform: formatCpf },
                { key: 'phone', label: 'WhatsApp', icon: Phone, type: 'tel', placeholder: '(11) 99999-9999', transform: formatPhone },
                { key: 'email', label: 'E-mail', icon: Mail, type: 'email', placeholder: 'seu@email.com', transform: (v: string) => v },
              ].map(({ key, label, icon: Icon, type, placeholder, transform }) => (
                <div key={key} className="space-y-1.5">
                  <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    <Icon size={10} />
                    {label}
                  </label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={form[key as keyof typeof form]}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [key]: transform(e.target.value) }))
                    }
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all text-white placeholder:text-gray-600 ${errors[key as keyof typeof errors]
                        ? 'border-red-500/50 focus:border-red-400'
                        : 'border-white/10 focus:border-emerald-500/50'
                      }`}
                  />
                  {errors[key as keyof typeof errors] && (
                    <p className="text-red-400 text-[10px] font-bold">{errors[key as keyof typeof errors]}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Quantidade de bilhetes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Quantidade de Bilhetes</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={decrementTickets}
                    className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-lg hover:bg-white/20 transition-all active:scale-90 cursor-pointer"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-xl font-black w-16 text-center">{ticketCount}</span>
                  <button
                    onClick={incrementTickets}
                    className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-lg hover:bg-white/20 transition-all active:scale-90 cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {boxes > 0 && (
                <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-3">
                  <Gift size={18} className="text-purple-400 shrink-0" />
                  <p className="text-xs font-bold text-purple-300">
                    Você ganha{' '}
                    <span className="text-white font-black">{boxes} caixa{boxes > 1 ? 's' : ''} misteriosa{boxes > 1 ? 's' : ''}!</span>
                    {' '}({Math.round(winProbability * 100)}% de chance de prêmio por caixa)
                  </p>
                </div>
              )}
            </div>

            {/* Incentivo para próximo nível */}
            <AnimatePresence mode="wait">
              {nextIncentive && (
                <motion.div
                  key={nextIncentive.minTickets}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
                      <Gift size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-tight">
                        {boxes > 0 ? 'Quer ganhar mais caixas?' : 'Ganhe uma Caixa Misteriosa!'}
                      </p>
                      <p className="text-[10px] text-purple-300 font-medium mt-0.5">
                        Faltam{' '}
                        <span className="text-white font-black">
                          {nextIncentive.minTickets - ticketCount} bilhetes
                        </span>{' '}
                        para levar{' '}
                        <span className="text-white font-black">
                          {nextIncentive.boxes} {nextIncentive.boxes === 1 ? 'caixa' : 'caixas'}!
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setTicketCount(nextIncentive.minTickets)}
                    className="w-full bg-purple-500 hover:bg-purple-400 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus size={14} />
                    ADICIONAR +{nextIncentive.minTickets - ticketCount} BILHETES
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Resumo do valor */}
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl px-6 py-4 flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</span>
              <span className="text-2xl font-black text-emerald-400">
                R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {apiError && (
              <p className="text-red-400 text-xs font-bold text-center bg-red-500/10 rounded-xl px-4 py-3 border border-red-500/20">
                {apiError}
              </p>
            )}
          </div>

          <div className="bg-black/20 p-8 space-y-4">
            <button
              onClick={handlePay}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-5 rounded-2xl shadow-lg shadow-emerald-500/20 uppercase tracking-widest transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Gerando PIX...
                </>
              ) : (
                'Pagar com PIX'
              )}
            </button>
            <button
              onClick={() => router.back()}
              className="w-full text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest py-2 cursor-pointer transition-colors"
            >
              Voltar
            </button>
          </div>
        </motion.div>
      </main>

      <div className="max-w-2xl mx-auto px-4 pb-8">
        <Footer
          instagramUrl={tenant?.instagramUrl}
          telegramUrl={tenant?.telegramUrl}
          supportUrl={tenant?.supportUrl}
        />
      </div>
    </div>
  );
}
