import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, BarChart3, Users, TrendingUp, Gift } from 'lucide-react';

interface RaffleStats {
  id: string;
  title: string;
  status: string;
  totalNumbers: number;
  soldTickets: number;
  price: number;
  mysteryBoxEnabled: boolean;
}

interface AdminDashboardProps {
  tenant: { id: string; name: string; slug: string };
  stats: {
    totalTicketsSold: number;
    totalRevenue: number;
    totalBuyers: number;
  };
  raffles: RaffleStats[];
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  tenant,
  stats,
  raffles,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'raffles'>('stats');

  const tabs = [
    { id: 'stats' as const, label: 'Métricas' },
    { id: 'raffles' as const, label: 'Rifas' },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] pb-20">
      <header className="py-6 px-6 flex items-center justify-between border-b border-white/5 sticky top-0 bg-[#0f172a]/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={onLogout}
            className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-black text-white">Dashboard</h1>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
              {tenant.name}
            </p>
          </div>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-gray-400 hover:text-white'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 mt-8 space-y-8">
        {activeTab === 'stats' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                <TrendingUp className="text-emerald-400" size={24} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  Total Arrecadado
                </p>
                <p className="text-2xl font-black text-white">
                  R${' '}
                  {stats.totalRevenue.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                <BarChart3 className="text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  Bilhetes Vendidos
                </p>
                <p className="text-2xl font-black text-white">
                  {stats.totalTicketsSold.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                <Users className="text-purple-400" size={24} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  Compradores Únicos
                </p>
                <p className="text-2xl font-black text-white">
                  {stats.totalBuyers.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'raffles' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {raffles.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p>Nenhuma rifa cadastrada.</p>
              </div>
            ) : (
              raffles.map((raffle) => {
                const progress = Math.min(
                  raffle.totalNumbers > 0
                    ? (raffle.soldTickets / raffle.totalNumbers) * 100
                    : 0,
                  100
                );
                return (
                  <div
                    key={raffle.id}
                    className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-black text-white">{raffle.title}</p>
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${raffle.status === 'ACTIVE'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-gray-500/20 text-gray-400'
                              }`}
                          >
                            {raffle.status === 'ACTIVE' ? 'Ativa' : 'Finalizada'}
                          </span>
                          {raffle.mysteryBoxEnabled && (
                            <span className="text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest bg-purple-500/20 text-purple-400 flex items-center gap-1">
                              <Gift size={10} /> Mystery Box
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-black text-lg">
                          R${' '}
                          {raffle.price.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-gray-500 text-xs">por bilhete</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-500 font-medium">
                        <span>{raffle.soldTickets.toLocaleString('pt-BR')} vendidos</span>
                        <span>
                          {(raffle.totalNumbers - raffle.soldTickets).toLocaleString('pt-BR')}{' '}
                          restantes
                        </span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-600 font-bold text-center">
                        {progress.toFixed(1)}% vendido
                      </p>
                    </div>

                    <div className="flex justify-between text-xs text-gray-400 pt-2 border-t border-white/5">
                      <span>
                        Arrecadado:{' '}
                        <span className="text-white font-black">
                          R${' '}
                          {(raffle.soldTickets * raffle.price).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </span>
                      <span>
                        Total:{' '}
                        <span className="text-white font-black">
                          {raffle.totalNumbers.toLocaleString('pt-BR')} bilhetes
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};
