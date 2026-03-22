"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Trophy, Edit, FileText, LogOut, Heart } from "lucide-react";
import { TenantLogoHeader } from "@/components/tenant/tenant-logo-header";

type MeResponse = {
  success: boolean;
  client?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    cpf: string;
    nickname?: string | null;
    avatar?: string | null;
    banner?: string | null;
  };
  summary?: {
    totalTickets: number;
    paidTickets: number;
    pendingTickets: number;
    rafflesParticipated: number;
    totalSpent: number;
    winsCount: number;
  };
  tickets?: Array<{
    id: string;
    number: string;
    status: string;
    paymentStatus: string;
    raffle: {
      id: string;
      title: string;
      slug: string;
      image?: string | null;
    };
  }>;
  raffles?: Array<{
    id: string;
    title: string;
    slug: string;
    image?: string | null;
    status: string;
  }>;
  prizes?: Array<{
    id: string;
    title: string;
    raffleTitle?: string | null;
    createdAt: string;
  }>;
  payments?: Array<{
    id: string;
    status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELED";
    totalValue: number;
    method: string;
    ticketCount: number;
    createdAt: string;
  }>;
  error?: string;
};

type ClientProfileViewProps = {
  slug: string;
  tenant?: {
    name?: string;
    logoUrl?: string | null;
  };
};

export function ClientProfileView({ slug, tenant }: ClientProfileViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("");
  const [banner, setBanner] = useState("");
  const [email, setEmail] = useState("");

  const [summary, setSummary] = useState<MeResponse["summary"]>();
  const [tickets, setTickets] = useState<MeResponse["tickets"]>([]);
  const [raffles, setRaffles] = useState<MeResponse["raffles"]>([]);
  const [prizes, setPrizes] = useState<MeResponse["prizes"]>([]);
  const [payments, setPayments] = useState<MeResponse["payments"]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!slug) {
      return;
    }

    void loadProfile();
  }, [slug]);

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/public/client/me?slug=${encodeURIComponent(slug)}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as MeResponse;

      if (!response.ok || !data.success || !data.client) {
        if (response.status === 401 || response.status === 403) {
          router.replace(`/${slug}/login`);
          return;
        }

        setError(data.error || "Nao foi possivel carregar o perfil.");
        return;
      }

      setName(data.client.name);
      setNickname(data.client.nickname || data.client.name.split(" ")[0]);
      setAvatar(data.client.avatar || "");
      setBanner(data.client.banner || "");
      setEmail(data.client.email);

      setSummary(data.summary);
      setTickets(data.tickets || []);
      setRaffles(data.raffles || []);
      setPrizes(data.prizes || []);
      setPayments(data.payments || []);
    } catch {
      setError("Erro de conexao ao carregar perfil.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    setIsSaving(true);
    try {
      const response = await fetch("/api/public/client/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, nickname, avatar, banner }),
      });

      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        setError(data.error || "Nao foi possivel salvar perfil.");
        return;
      }

      setMessage("Perfil atualizado com sucesso.");
      setIsEditing(false);
      router.refresh();
    } catch {
      setError("Erro de conexao ao salvar perfil.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/public/client/logout", { method: "POST" });
    router.replace(`/${slug}`);
    router.refresh();
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10">
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-sm text-slate-300"
        >
          Carregando seu perfil...
        </motion.p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-40 border-b border-slate-700/50 bg-slate-950/95 backdrop-blur px-4 py-4"
      >
        <TenantLogoHeader
          href={`/${slug}`}
          logoUrl={tenant?.logoUrl}
          tenantName={tenant?.name}
        />
      </motion.div>

      <main className="mx-auto w-full max-w-6xl">
        {/* Banner Section */}
        <div className="relative">
          <div className="h-48 w-full bg-gradient-to-r from-cyan-600/30 via-slate-900 to-slate-900">
            {banner ? (
              <img
                src={banner}
                alt="Profile banner"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-600/20 to-slate-900" />
            )}
          </div>

          {/* Profile Overlap */}
          <div className="px-4 md:px-6">
            <div className="relative -mt-20 mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="h-32 w-32 rounded-xl border-4 border-slate-950 bg-gradient-to-br from-cyan-400 to-slate-700 flex items-center justify-center overflow-hidden shadow-lg">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-bold text-white">
                        {name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Profile Info */}
                <div className="pb-2">
                  <h1 className="text-3xl font-bold text-white">{nickname}</h1>
                  <p className="text-sm text-slate-400">{email}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    CPF: {email.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              {!isEditing && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition-colors hover:bg-cyan-500/20"
                  >
                    <Edit size={16} />
                    Editar Perfil
                  </button>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20"
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-4 md:px-6 pb-12">
          {error && (
            <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          {message && (
            <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              {message}
            </p>
          )}

          {/* Stats Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mb-8 grid gap-4 md:grid-cols-3"
          >
            <div className="rounded-lg border border-white/10 bg-slate-900/40 p-6">
              <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Total Gasto</p>
              <p className="mt-2 text-2xl font-bold text-cyan-400">
                R$ {(summary?.totalSpent || 0).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-slate-900/40 p-6">
              <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Bilhetes Comprados</p>
              <p className="mt-2 text-2xl font-bold text-emerald-400">{summary?.totalTickets || 0}</p>
            </div>

            <div className="rounded-lg border border-white/10 bg-slate-900/40 p-6">
              <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Rifas Participando</p>
              <p className="mt-2 text-2xl font-bold text-amber-400">{summary?.rafflesParticipated || 0}</p>
            </div>
          </motion.section>

          {/* Content Tabs */}
          {isEditing ? (
            // Edit Form
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 max-w-2xl"
            >
              <h2 className="text-lg font-semibold text-zinc-100 mb-4">Editar Perfil</h2>
              <form className="grid gap-4" onSubmit={handleSaveProfile}>
                <div>
                  <label className="text-xs font-medium text-slate-400">Nome</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-800/70 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400">Apelido (Como você quer ser chamado)</label>
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-800/70 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400">Avatar (URL da imagem)</label>
                  <input
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-800/70 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400">Banner (URL da imagem)</label>
                  <input
                    value={banner}
                    onChange={(e) => setBanner(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-800/70 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400">Email (Não pode ser alterado)</label>
                  <input
                    value={email}
                    disabled
                    className="mt-1 w-full cursor-not-allowed rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-400"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-700 disabled:opacity-70"
                  >
                    {isSaving ? "Salvando..." : "Salvar alterações"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/5"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.article>
          ) : (
            // View Sections
            <div className="space-y-6">
              {/* Achievements Section */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <Trophy size={20} className="text-amber-400" />
                  <h2 className="text-lg font-semibold text-white">Minhas Caixas (Conquistas)</h2>
                </div>

                {prizes && prizes.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {prizes.map((prize) => (
                      <div
                        key={prize.id}
                        className="rounded-lg border border-white/10 bg-slate-900/30 p-4 transition-colors hover:border-amber-500/50 hover:bg-slate-900/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/20">
                            <Trophy size={24} className="text-amber-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{prize.title}</p>
                            <p className="text-xs text-slate-400">{prize.raffleTitle}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-white/10 bg-slate-900/30 p-8 text-center">
                    <Trophy size={32} className="mx-auto mb-2 text-slate-600" />
                    <p className="text-sm text-slate-400">Nenhuma caixa conquistada ainda</p>
                  </div>
                )}
              </motion.section>

              {/* Payment History */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-cyan-400" />
                  <h2 className="text-lg font-semibold text-white">Histórico de Pagamentos</h2>
                </div>

                {payments && payments.length > 0 ? (
                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/30 p-4 transition-colors hover:border-cyan-500/30 hover:bg-slate-900/50"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">
                            {payment.ticketCount} bilhete{payment.ticketCount > 1 ? "s" : ""}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(payment.createdAt).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })} • {payment.method}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 ml-4">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-white">
                              R$ {payment.totalValue.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                          </div>

                          {payment.status === "COMPLETED" && (
                            <div className="flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-1">
                              <span className="text-xs font-medium text-emerald-200">✓ Confirmado</span>
                            </div>
                          )}
                          {payment.status === "PENDING" && (
                            <div className="flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-1">
                              <span className="text-xs font-medium text-amber-200">⏱ Pendente</span>
                            </div>
                          )}
                          {(payment.status === "FAILED" || payment.status === "CANCELED") && (
                            <div className="flex items-center gap-1 rounded-full bg-red-500/20 border border-red-500/40 px-2 py-1">
                              <span className="text-xs font-medium text-red-200">✕ Falhou</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-white/10 bg-slate-900/30 p-8 text-center">
                    <FileText size={32} className="mx-auto mb-2 text-slate-600" />
                    <p className="text-sm text-slate-400">Nenhum pagamento realizado ainda</p>
                  </div>
                )}
              </motion.section>

              {/* Raffles Participating */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <Heart size={20} className="text-red-400" />
                  <h2 className="text-lg font-semibold text-white">Rifas que Participo</h2>
                </div>

                {raffles && raffles.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {raffles.map((raffle) => (
                      <button
                        key={raffle.id}
                        onClick={() => router.push(`/${slug}`)}
                        className="rounded-lg border border-white/10 bg-slate-900/30 p-4 text-left transition-colors hover:border-red-500/50 hover:bg-slate-900/50"
                      >
                        <p className="font-medium text-white">{raffle.title}</p>
                        <p className="text-xs text-slate-400 mt-1">Clique para visualizar</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-white/10 bg-slate-900/30 p-8 text-center">
                    <Heart size={32} className="mx-auto mb-2 text-slate-600" />
                    <p className="text-sm text-slate-400">Você ainda não participa de nenhuma rifa</p>
                  </div>
                )}
              </motion.section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
