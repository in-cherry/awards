import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, BarChart3, Users, TrendingUp, Gift, Settings, Eye, Calendar, DollarSign, Activity, PieChart } from 'lucide-react';
import Image from 'next/image';

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
  tenant: { id: string; name: string; slug: string; logoUrl?: string | null };
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
  const [activeTab, setActiveTab] = useState<'overview' | 'raffles' | 'settings'>('overview');

  const tabs = [
    { id: 'overview' as const, label: 'Visão Geral', icon: PieChart },
    { id: 'raffles' as const, label: 'Rifas', icon: Gift },
    { id: 'settings' as const, label: 'Configurações', icon: Settings },
  ];

  // Calculate additional metrics
  const activeRaffles = raffles.filter(r => r.status === 'ACTIVE').length;
  const finishedRaffles = raffles.filter(r => r.status === 'FINISHED').length;
  const averageTicketPrice = raffles.length > 0
    ? raffles.reduce((sum, r) => sum + r.price, 0) / raffles.length
    : 0;
  const totalPotentialRevenue = raffles.reduce((sum, r) => sum + (r.totalNumbers * r.price), 0);
  const conversionRate = totalPotentialRevenue > 0 ? (stats.totalRevenue / totalPotentialRevenue) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Header */}
      <header className="py-6 px-6 flex items-center justify-between border-b border-white/10 sticky top-0 bg-gray-900/90 backdrop-blur-md z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={onLogout}
            className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-white group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div className="flex items-center gap-3">
            {tenant.logoUrl && (
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500/30">
                <Image
                  src={tenant.logoUrl}
                  alt={`${tenant.name} logo`}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-xl font-black text-white">Dashboard Administrativo</h1>
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest">
                {tenant.name}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 gap-1">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <IconComponent size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-4 hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                    <DollarSign className="text-emerald-400" size={24} />
                  </div>
                  <span className="text-xs text-emerald-400 font-bold">+12.5%</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                    Total Arrecadado
                  </p>
                  <p className="text-2xl font-black text-white">
                    R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-4 hover:border-blue-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                    <BarChart3 className="text-blue-400" size={24} />
                  </div>
                  <span className="text-xs text-blue-400 font-bold">↗</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                    Bilhetes Vendidos
                  </p>
                  <p className="text-2xl font-black text-white">
                    {stats.totalTicketsSold.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-4 hover:border-purple-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                    <Users className="text-purple-400" size={24} />
                  </div>
                  <span className="text-xs text-purple-400 font-bold">+{stats.totalBuyers}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                    Compradores Únicos
                  </p>
                  <p className="text-2xl font-black text-white">
                    {stats.totalBuyers.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-4 hover:border-yellow-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center">
                    <Activity className="text-yellow-400" size={24} />
                  </div>
                  <span className="text-xs text-yellow-400 font-bold">{conversionRate.toFixed(1)}%</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                    Taxa de Conversão
                  </p>
                  <p className="text-2xl font-black text-white">
                    {conversionRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                    <Gift className="text-emerald-400" size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">{activeRaffles}</p>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Rifas Ativas</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-gray-500/10 rounded-full flex items-center justify-center mx-auto">
                    <Calendar className="text-gray-400" size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">{finishedRaffles}</p>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Rifas Finalizadas</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
                    <TrendingUp className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">
                      R$ {averageTicketPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Preço Médio/Bilhete</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'raffles' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-white">Gestão de Rifas</h2>
                <p className="text-gray-400">Monitore e gerencie suas rifas</p>
              </div>
              <button className="bg-emerald-500 hover:bg-emerald-400 text-white font-black px-6 py-3 rounded-2xl uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20">
                + Nova Rifa
              </button>
            </div>

            {raffles.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-12 max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-gray-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Gift size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-4">Nenhuma Rifa Cadastrada</h3>
                  <p className="text-gray-400 mb-6">Comece criando sua primeira rifa para começar a vender bilhetes.</p>
                  <button className="bg-emerald-500 hover:bg-emerald-400 text-white font-black px-6 py-3 rounded-2xl uppercase tracking-widest transition-all">
                    Criar Primeira Rifa
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-6">
                {raffles.map((raffle) => {
                  const progress = Math.min(
                    raffle.totalNumbers > 0 ? (raffle.soldTickets / raffle.totalNumbers) * 100 : 0,
                    100
                  );
                  const revenue = raffle.soldTickets * raffle.price;
                  const potentialRevenue = raffle.totalNumbers * raffle.price;

                  return (
                    <div
                      key={raffle.id}
                      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:border-emerald-500/30 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-6 mb-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors">
                              {raffle.title}
                            </h3>
                            <span
                              className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest ${raffle.status === 'ACTIVE'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                }`}
                            >
                              {raffle.status === 'ACTIVE' ? '🔥 Ativa' : '✅ Finalizada'}
                            </span>
                            {raffle.mysteryBoxEnabled && (
                              <span className="text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                                <Gift size={12} /> Mystery Box
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-black/20 rounded-xl p-3 text-center">
                              <p className="text-lg font-black text-white">{raffle.soldTickets.toLocaleString('pt-BR')}</p>
                              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Vendidos</p>
                            </div>
                            <div className="bg-black/20 rounded-xl p-3 text-center">
                              <p className="text-lg font-black text-emerald-400">
                                R$ {revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Arrecadado</p>
                            </div>
                            <div className="bg-black/20 rounded-xl p-3 text-center">
                              <p className="text-lg font-black text-blue-400">
                                R$ {raffle.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Por Bilhete</p>
                            </div>
                            <div className="bg-black/20 rounded-xl p-3 text-center">
                              <p className="text-lg font-black text-purple-400">{progress.toFixed(1)}%</p>
                              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Progresso</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button className="w-10 h-10 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400 transition-all">
                            <Eye size={16} />
                          </button>
                          <button className="w-10 h-10 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/30 rounded-xl flex items-center justify-center text-gray-400 transition-all">
                            <Settings size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm font-bold">
                          <span className="text-emerald-400">
                            {raffle.soldTickets.toLocaleString('pt-BR')} vendidos
                          </span>
                          <span className="text-gray-400">
                            {(raffle.totalNumbers - raffle.soldTickets).toLocaleString('pt-BR')} restantes
                          </span>
                        </div>
                        <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-blue-500 h-3 rounded-full transition-all duration-700 ease-out shadow-lg shadow-emerald-500/20"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>
                            Meta: R$ {potentialRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span>
                            Total: {raffle.totalNumbers.toLocaleString('pt-BR')} bilhetes
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-black text-white mb-2">Configurações da Plataforma</h2>
              <p className="text-gray-400">Personalize sua experiência de administração</p>
            </div>

            <div className="grid gap-6">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
                <h3 className="text-lg font-black text-white mb-4">Informações do Tenant</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Nome da Empresa
                      </label>
                      <input
                        type="text"
                        value={tenant.name}
                        readOnly
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Slug/URL
                      </label>
                      <input
                        type="text"
                        value={tenant.slug}
                        readOnly
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
                <h3 className="text-lg font-black text-white mb-4">Aparência</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Logo da Empresa
                    </label>
                    <div className="flex items-center gap-4">
                      {tenant.logoUrl ? (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-white/10">
                          <Image
                            src={tenant.logoUrl}
                            alt={`${tenant.name} logo`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-600/20 rounded-xl flex items-center justify-center border-2 border-dashed border-white/10">
                          <span className="text-2xl">📷</span>
                        </div>
                      )}
                      <button className="bg-emerald-500 hover:bg-emerald-400 text-white font-black px-4 py-2 rounded-xl text-xs uppercase tracking-widest transition-all">
                        Alterar Logo
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
                <h3 className="text-lg font-black text-white mb-4">Preferências</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">Notificações por Email</p>
                      <p className="text-sm text-gray-400">Receba alertas sobre vendas e status das rifas</p>
                    </div>
                    <button className="w-12 h-6 bg-emerald-500 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 transition-all"></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">Modo Escuro</p>
                      <p className="text-sm text-gray-400">Aparência atual da interface</p>
                    </div>
                    <button className="w-12 h-6 bg-emerald-500 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 transition-all"></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};
