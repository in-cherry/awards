import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, BarChart3, Users, TrendingUp, Gift, Settings, Eye, Calendar, DollarSign, Activity, PieChart } from 'lucide-react';
import Image from 'next/image';
import { Footer } from '@/components/Footer';

interface RaffleStats {
  id: string;
  title: string;
  status: string;
  totalNumbers: number;
  soldTickets: number;
  price: number;
  mysteryBoxEnabled: boolean;
  minNumbers: number;
  bannerUrl?: string | null;
  description?: string | null;
}

interface AdminDashboardProps {
  tenant: {
    id: string; name: string; slug: string;
    logoUrl?: string;
    faviconUrl?: string;
    customDomain?: string | null;
    owner?: { id: string; name: string; avatarUrl?: string | null; };
    homeView?: string;
  };
  stats: {
    totalTicketsSold: number;
    totalRevenue: number;
    totalFee: number;
    netRevenue: number;
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
  const [logoUrl, setLogoUrl] = useState(tenant.logoUrl || '');
  const [faviconUrl, setFaviconUrl] = useState(tenant.faviconUrl || '');
  const [ownerName, setOwnerName] = useState(tenant.owner?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(tenant.owner?.avatarUrl || '');
  const [homeView, setHomeView] = useState(tenant.homeView || 'RAFFLE');
  const [isSaving, setIsSaving] = useState(false);
  const [editingRaffle, setEditingRaffle] = useState<Partial<RaffleStats> | null>(null);
  const [isSavingRaffle, setIsSavingRaffle] = useState(false);

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

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: tenant.id,
          logoUrl,
          faviconUrl,
          ownerName,
          avatarUrl,
          homeView,
        }),
      });
      if (!res.ok) throw new Error('Erro ao salvar configurações');
      alert('Configurações salvas com sucesso!');
    } catch (err) {
      alert('Ocorreu um erro ao salvar as configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setUrl: React.Dispatch<React.SetStateAction<string>>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro no upload');
      setUrl(data.url);
    } catch (err) {
      alert('Erro ao enviar imagem. Verifique se o arquivo é válido.');
    }
  };

  const handleSaveRaffle = async () => {
    if (!editingRaffle?.title || !editingRaffle?.price || !editingRaffle?.totalNumbers) {
      alert('Preencha os campos obrigatórios (Título, Preço e Total de Números).');
      return;
    }

    setIsSavingRaffle(true);
    try {
      const method = editingRaffle.id ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/raffles', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingRaffle,
          tenantId: tenant.id
        })
      });
      if (!res.ok) throw new Error('Falha ao salvar rifa');
      alert('Rifa salva com sucesso! Atualize a página para ver as alterações.');
      setEditingRaffle(null);
    } catch (error) {
      alert('Ocorreu um erro ao salvar a rifa.');
    } finally {
      setIsSavingRaffle(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 to-black">
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
            {logoUrl && (
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500/30">
                <Image
                  src={logoUrl}
                  alt={`${tenant.name} logo`}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-xl font-black text-white">Painel de Controle</h1>
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

      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
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
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                    Valor Bruto
                  </p>
                  <p className="text-2xl font-black text-white">
                    R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-4 hover:border-red-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center">
                    <PieChart className="text-red-400" size={24} />
                  </div>
                  <span className="text-xs text-red-400 font-bold">20%</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                    Taxa da Plataforma
                  </p>
                  <p className="text-2xl font-black text-white">
                    R$ {stats.totalFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-4 hover:border-blue-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                    <DollarSign className="text-blue-400" size={24} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                    Valor Líquido <span className="text-emerald-400 font-black">(A Receber)</span>
                  </p>
                  <p className="text-2xl font-black text-white">
                    R$ {stats.netRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
            {editingRaffle !== null ? (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8">
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                  <h3 className="text-xl font-black text-white">
                    {editingRaffle.id ? 'Editar Rifa' : 'Adicionar Nova Rifa'}
                  </h3>
                  <button onClick={() => setEditingRaffle(null)} className="text-gray-400 hover:text-white transition-colors">
                    Descartar <span className="text-xl leading-none">×</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nome da Rifa *</label>
                      <input
                        type="text"
                        value={editingRaffle.title || ''}
                        onChange={e => setEditingRaffle({ ...editingRaffle, title: e.target.value })}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50"
                        placeholder="Ex: iPhone 15 Pro Max (10 Mil no PIX)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Preço do Bilhete (R$) *</label>
                      <input
                        type="number" step="0.01" min="0"
                        value={editingRaffle.price || ''}
                        onChange={e => setEditingRaffle({ ...editingRaffle, price: parseFloat(e.target.value) })}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Números *</label>
                        <input
                          type="number" min="1"
                          value={editingRaffle.totalNumbers || ''}
                          onChange={e => setEditingRaffle({ ...editingRaffle, totalNumbers: parseInt(e.target.value) })}
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Mín. Compra</label>
                        <input
                          type="number" min="1"
                          value={editingRaffle.minNumbers || 1}
                          onChange={e => setEditingRaffle({ ...editingRaffle, minNumbers: parseInt(e.target.value) })}
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Imagem / Banner URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editingRaffle.bannerUrl || ''}
                          onChange={e => setEditingRaffle({ ...editingRaffle, bannerUrl: e.target.value })}
                          className="flex-1 min-w-0 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50"
                          placeholder="Link da imagem..."
                        />
                        <label className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-3 rounded-xl cursor-pointer transition-all shrink-0 flex items-center justify-center">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, (url) => setEditingRaffle((prev) => prev ? { ...prev, bannerUrl: typeof url === 'string' ? url : String(url) } : null))}
                          />
                          <span className="text-xs font-black uppercase tracking-widest">Upload</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Status</label>
                      <select
                        value={editingRaffle.status || 'DRAFT'}
                        onChange={e => setEditingRaffle({ ...editingRaffle, status: e.target.value as any })}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50"
                      >
                        <option value="DRAFT">Rascunho (Oculta)</option>
                        <option value="ACTIVE">Ativa (Aberta)</option>
                        <option value="FINISHED">Finalizada</option>
                      </select>
                    </div>
                    <div className="pt-2">
                      <button onClick={handleSaveRaffle} disabled={isSavingRaffle} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black py-4 rounded-xl font-black uppercase tracking-widest transition-colors disabled:opacity-50">
                        {isSavingRaffle ? 'Salvando...' : 'Salvar Rifa'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black text-white">Gestão de Rifas</h2>
                    <p className="text-gray-400">Monitore e gerencie suas rifas</p>
                  </div>
                  <button onClick={() => setEditingRaffle({ status: 'DRAFT', minNumbers: 1 })} className="bg-emerald-500 hover:bg-emerald-400 text-white font-black px-6 py-3 rounded-2xl uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20">
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
                      <button onClick={() => setEditingRaffle({ status: 'DRAFT', minNumbers: 1 })} className="bg-emerald-500 hover:bg-emerald-400 text-white font-black px-6 py-3 rounded-2xl uppercase tracking-widest transition-all">
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
                      const netRevenue = revenue * 0.8; // 80% repassado após taxa de plataforma de 20%
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

                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                                <div className="bg-black/20 rounded-xl p-3 text-center">
                                  <p className="text-lg font-black text-white">{raffle.soldTickets.toLocaleString('pt-BR')}</p>
                                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Vendidos</p>
                                </div>
                                <div className="bg-black/20 rounded-xl p-3 text-center">
                                  <p className="text-lg font-black text-white">
                                    R$ {revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Arrecadado</p>
                                </div>
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center shadow-inner">
                                  <p className="text-lg font-black text-emerald-400">
                                    R$ {netRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                  <p className="text-xs text-emerald-500/70 font-bold uppercase tracking-widest leading-tight">Líquido<br /><span className="text-[9px]">(A Receber)</span></p>
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
                              <button onClick={() => setEditingRaffle(raffle)} className="w-10 h-10 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/30 rounded-xl flex items-center justify-center text-gray-400 transition-all">
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
              </>
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
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">ID (Slug) (Somente Leitura)</label>
                      <input
                        type="text"
                        value={tenant.slug}
                        disabled
                        className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none opacity-60 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Nome do Sistema (Somente Leitura)</label>
                      <input
                        type="text"
                        value={tenant.name}
                        disabled
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none opacity-60 cursor-not-allowed"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Domínio Customizado (Somente Leitura)</label>
                      <input
                        type="text"
                        placeholder="ex: www.minharifa.com.br"
                        value={tenant.customDomain || ''}
                        disabled
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none opacity-60 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
                <h3 className="text-lg font-black text-white mb-4">Organizador da Rifa</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Nome do Organizador
                      </label>
                      <input
                        type="text"
                        placeholder={tenant.owner?.name || "Nome do Organizador"}
                        value={ownerName || ''}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Avatar do Organizador
                      </label>
                      <div className="flex items-center gap-4">
                        {avatarUrl ? (
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-white/10 shrink-0">
                            <Image
                              src={avatarUrl}
                              alt={ownerName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gray-600/20 rounded-xl flex items-center justify-center border-2 border-dashed border-white/10 shrink-0 text-gray-400">
                            👤
                          </div>
                        )}
                        <input
                          type="text"
                          placeholder={tenant.owner?.avatarUrl || "URL do Avatar (https://...)"}
                          value={avatarUrl || ''}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-all"
                        />
                        <label className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-3 rounded-xl cursor-pointer transition-all shrink-0 flex items-center justify-center">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, setAvatarUrl)}
                          />
                          <span className="text-xs font-black uppercase tracking-widest">Upload</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
                <h3 className="text-lg font-black text-white mb-4">Aparência</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Logo da Empresa
                      </label>
                      <div className="flex items-center gap-4">
                        {logoUrl ? (
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-white/10">
                            <Image
                              src={logoUrl}
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
                        <input
                          type="text"
                          placeholder="URL da Logo"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          className="flex-1 min-w-0 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-all"
                        />
                        <label className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-3 rounded-xl cursor-pointer transition-all shrink-0 flex items-center justify-center">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, setLogoUrl)}
                          />
                          <span className="text-xs font-black uppercase tracking-widest hidden lg:block">Upload</span>
                          <span className="text-xs font-black uppercase tracking-widest lg:hidden">⬆</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Favicon (Ícone da Aba)
                      </label>
                      <div className="flex items-center gap-4">
                        {faviconUrl ? (
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-white/10 bg-white">
                            <Image
                              src={faviconUrl}
                              alt={`${tenant.name} favicon`}
                              fill
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-gray-600/20 rounded-xl flex items-center justify-center border-2 border-dashed border-white/10">
                            <span className="text-2xl">🌍</span>
                          </div>
                        )}
                        <input
                          type="text"
                          placeholder="URL do Favicon"
                          value={faviconUrl}
                          onChange={(e) => setFaviconUrl(e.target.value)}
                          className="flex-1 min-w-0 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-all"
                        />
                        <label className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-3 rounded-xl cursor-pointer transition-all shrink-0 flex items-center justify-center">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, setFaviconUrl)}
                          />
                          <span className="text-xs font-black uppercase tracking-widest hidden lg:block">Upload</span>
                          <span className="text-xs font-black uppercase tracking-widest lg:hidden">⬆</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-white/10 pt-6">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                      Visão Inicial do Site
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => setHomeView('RAFFLE')}
                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${homeView === 'RAFFLE' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'}`}
                      >
                        <div className="w-12 h-8 bg-current opacity-20 rounded shadow-md mb-2"></div>
                        <span className="font-bold">Destaque de Rifa</span>
                        <span className="text-xs text-center opacity-70">Abre direto na Rifa Ativa principal</span>
                      </button>
                      <button
                        onClick={() => setHomeView('LIST')}
                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${homeView === 'LIST' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'}`}
                      >
                        <div className="w-12 h-8 flex gap-1 mb-2">
                          <div className="flex-1 bg-current opacity-20 rounded shadow-sm"></div>
                          <div className="flex-1 bg-current opacity-20 rounded shadow-sm"></div>
                        </div>
                        <span className="font-bold">Lista de Rifas</span>
                        <span className="text-xs text-center opacity-70">Exibe todas as rifas disponíveis</span>
                      </button>
                    </div>
                  </div>

                  {/* Mercado Pago Setup */}
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8">
                    <h3 className="text-lg font-black text-white mb-4 uppercase tracking-widest flex items-center gap-3">
                      Integração Financeira
                    </h3>
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 border border-[#009EE3]/20 rounded-2xl bg-[#009EE3]/5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#009EE3]/10 flex items-center justify-center border border-[#009EE3]/20 shrink-0">
                            <span className="text-2xl">🤝</span>
                          </div>
                          <div>
                            <p className="font-bold text-white text-lg">Mercado Pago</p>
                            <p className="text-sm text-[#009EE3]/80 font-medium">Conecte sua conta para receber os pagamentos automaticamente com Split Seguro.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => window.location.href = `/api/auth/mercadopago/connect?tenantId=${tenant.id}`}
                          className="bg-[#009EE3] hover:bg-[#009EE3]/80 text-white shadow-lg shadow-[#009EE3]/20 px-6 py-3 rounded-xl font-black uppercase tracking-widest transition-all whitespace-nowrap"
                        >
                          Conectar Conta
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-white/10">
                    <button
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                      className="bg-emerald-500 hover:bg-emerald-400 text-white font-black px-6 py-3 rounded-xl text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                      {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      <div className="p-4 w-full max-w-7xl mx-auto">
        <Footer />
      </div>
    </div>
  );
};
