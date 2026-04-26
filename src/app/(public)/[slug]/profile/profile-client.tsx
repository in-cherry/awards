"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Edit, FileText, LogOut, Heart, Gift, Zap, ShoppingBag, ChevronRight, CheckCircle2, Clock, XCircle, Loader2, User, Camera } from "lucide-react";
import { TenantLogoHeader } from "@/components/tenant/tenant-logo-header";
import { Footer } from "@/components/tenant/footer";
import { clearSession } from "@/lib/session";

function getPlayerLevel(tickets: number): { label: string; color: string; glow: string } {
  if (tickets >= 200) return { label: "🏆 Lendário", color: "text-amber-300", glow: "shadow-amber-500/40" };
  if (tickets >= 50) return { label: "⚡ Veterano", color: "text-emerald-300", glow: "shadow-emerald-500/40" };
  if (tickets >= 10) return { label: "🔥 Explorador", color: "text-orange-300", glow: "shadow-orange-500/40" };
  return { label: "✨ Iniciante", color: "text-slate-300", glow: "shadow-slate-500/20" };
}

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
    winnerTicketNumber?: string | null;
  }>;
  prizes?: Array<{
    id: string;
    title: string;
    raffleTitle?: string | null;
    createdAt: string;
  }>;
  boxes?: Array<{
    id: string;
    raffleId: string;
    raffleTitle: string;
    raffleImage?: string | null;
    boxNumber: number;
    status: "OPENED" | "AVAILABLE";
    prizeTitle?: string | null;
    openedAt?: string | null;
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
    faviconUrl?: string | null;
  };
};

type OpenBoxApiResponse = {
  success?: boolean;
  error?: string;
  prize?: {
    id?: string;
    name?: string;
    value?: number;
    remaining?: number;
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
  const [cpf, setCpf] = useState("");

  const [summary, setSummary] = useState<MeResponse["summary"]>();
  const [tickets, setTickets] = useState<MeResponse["tickets"]>([]);
  const [raffles, setRaffles] = useState<MeResponse["raffles"]>([]);
  const [prizes, setPrizes] = useState<MeResponse["prizes"]>([]);
  const [boxes, setBoxes] = useState<MeResponse["boxes"]>([]);
  const [payments, setPayments] = useState<MeResponse["payments"]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isBoxModalOpen, setIsBoxModalOpen] = useState(false);
  const [activeBoxId, setActiveBoxId] = useState<string | null>(null);
  const [boxModalPhase, setBoxModalPhase] = useState<"opening" | "result">("opening");
  const [boxModalMessage, setBoxModalMessage] = useState("");
  const [isOpeningBox, setIsOpeningBox] = useState(false);
  const [isTicketsModalOpen, setIsTicketsModalOpen] = useState(false);
  const [selectedRaffleForTickets, setSelectedRaffleForTickets] = useState<NonNullable<MeResponse["raffles"]>[number] | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<NonNullable<MeResponse["payments"]>[number] | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  function maskCPF(value: string): string {
    const digits = String(value || "").replace(/\D/g, "");
    if (!digits) return "***.***.***-**";
    const lastTwo = digits.slice(-2).padStart(2, "*");
    return `***.***.***-${lastTwo}`;
  }

  const personalBoxes = useMemo(
    () => (boxes || []).map((box, index) => ({ ...box, personalNumber: index + 1 })),
    [boxes],
  );

  const selectedRaffleTickets = useMemo(() => {
    if (!selectedRaffleForTickets) return [];
    return (tickets || [])
      .filter(
        (ticket) =>
          ticket.raffle.id === selectedRaffleForTickets.id ||
          ticket.raffle.slug === selectedRaffleForTickets.slug,
      )
      .sort((a, b) => Number(a.number) - Number(b.number));
  }, [tickets, selectedRaffleForTickets]);

  const selectedRaffleWinningTicket = useMemo(() => {
    if (!selectedRaffleForTickets || selectedRaffleForTickets.status !== "FINISHED") {
      return null;
    }

    const winnerNumber = selectedRaffleForTickets.winnerTicketNumber ?? null;
    if (!winnerNumber) {
      return null;
    }

    const hasWinnerTicket = selectedRaffleTickets.some((ticket) => ticket.number === winnerNumber);
    return hasWinnerTicket ? winnerNumber : null;
  }, [selectedRaffleForTickets, selectedRaffleTickets]);

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
      setCpf(data.client.cpf || "");

      setSummary(data.summary);
      setTickets(data.tickets || []);
      setRaffles(data.raffles || []);
      setPrizes(data.prizes || []);
      setBoxes(data.boxes || []);
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
      setSaveSuccess(true);
      setTimeout(() => {
        setIsEditing(false);
        setSaveSuccess(false);
        router.refresh();
      }, 900);
    } catch {
      setError("Erro de conexao ao salvar perfil.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/public/client/logout", { method: "POST" });
    clearSession();
    router.replace(`/${slug}`);
    router.refresh();
  }

  async function handleBoxClick(box: NonNullable<MeResponse["boxes"]>[number]) {
    setError("");
    setMessage("");

    if (box.status === "OPENED") {
      setActiveBoxId(box.id);
      setBoxModalPhase("result");
      setBoxModalMessage(box.prizeTitle || "Nada, essa caixa veio vazia kk");
      setIsBoxModalOpen(true);
      return;
    }

    if (isOpeningBox) {
      return;
    }

    setActiveBoxId(box.id);
    setBoxModalPhase("opening");
    setBoxModalMessage("");
    setIsBoxModalOpen(true);
    setIsOpeningBox(true);

    try {
      const response = await fetch(`/api/mystery-box/${box.raffleId}/open?t=${Date.now()}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Pragma": "no-cache",
        },
      });

      const data = (await response.json()) as OpenBoxApiResponse;

      if (!response.ok || !data.success) {
        setBoxModalPhase("result");
        setBoxModalMessage(data.error || "Nao foi possivel abrir a caixa agora.");
        return;
      }

      setBoxModalPhase("result");
      setBoxModalMessage(data.prize?.name || "Nada, essa caixa veio vazia kk");
      await loadProfile();
    } catch {
      setBoxModalPhase("result");
      setBoxModalMessage("Erro de conexao ao abrir caixa.");
    } finally {
      setIsOpeningBox(false);
    }
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
    <div className="flex min-h-screen flex-col">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-40 border-b border-slate-500/10 bg-slate-900/85 backdrop-blur px-4 py-2.5"
      >
        <TenantLogoHeader
          href={`/${slug}`}
          logoUrl={tenant?.logoUrl}
          faviconUrl={tenant?.faviconUrl}
          tenantName={tenant?.name}
          compact
        />
      </motion.div>

      <main className="mx-auto w-full max-w-6xl flex-1">
        {/* Banner Section */}
        <div className="relative">
          <div className="h-48 w-full overflow-hidden rounded-b-3xl bg-gradient-to-r from-emerald-500/20 via-slate-900 to-slate-900">
            {banner ? (
              <img
                src={banner}
                alt="Profile banner"
                className="h-full w-full rounded-b-3xl object-cover"
              />
            ) : (
              <div className="absolute inset-0 rounded-b-3xl bg-gradient-to-b from-emerald-500/20 to-slate-900" />
            )}
          </div>

          {/* Profile Overlap */}
          <div className="px-4 md:px-6">
            <div className="relative -mt-20 mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-slate-950 bg-gradient-to-br from-emerald-400 to-slate-700 shadow-lg">
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-3xl font-bold text-white">{nickname}</h1>
                    {summary && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/10 border border-white/15 ${getPlayerLevel(summary.totalTickets).color}`}>
                        {getPlayerLevel(summary.totalTickets).label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">{email}</p>
                  <p className="text-xs text-slate-500 mt-1">CPF: {maskCPF(cpf)}</p>
                </div>
              </div>

              {/* Action Buttons */}
              {!isEditing && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20"
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
            <motion.div whileHover={{ y: -2 }} className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-slate-900/40 p-5">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBag size={14} className="text-emerald-400" />
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Investimento no sonho</p>
              </div>
              <p className="text-2xl font-black text-emerald-400">
                R$ {(summary?.totalSpent || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-slate-900/40 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-amber-400" />
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Suas chances de ganhar</p>
              </div>
              <p className="text-2xl font-black text-amber-400">{summary?.totalTickets || 0}</p>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} className="rounded-xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-slate-900/40 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Heart size={14} className="text-red-400" />
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rifas em disputa</p>
              </div>
              <p className="text-2xl font-black text-red-400">{summary?.rafflesParticipated || 0}</p>
            </motion.div>
          </motion.section>

          {/* View Sections */}
          <div className="space-y-6">
              {/* Boxes Section */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20">
                    <Gift size={18} className="text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Caixas Misteriosas</h2>
                    <p className="text-xs text-slate-500">Cada caixa pode esconder algo valioso. Abra e descubra.</p>
                  </div>
                  {personalBoxes.filter(b => b.status === "AVAILABLE").length > 0 && (
                    <span className="ml-auto animate-pulse rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                      {personalBoxes.filter(b => b.status === "AVAILABLE").length} pra abrir!
                    </span>
                  )}
                </div>

                {personalBoxes.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {personalBoxes.map((box, idx) => (
                      <motion.button
                        key={box.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.07 }}
                        whileHover={box.status === "AVAILABLE" ? { scale: 1.03, y: -3 } : {}}
                        whileTap={box.status === "AVAILABLE" ? { scale: 0.97 } : {}}
                        type="button"
                        onClick={() => handleBoxClick(box)}
                        disabled={isOpeningBox && activeBoxId === box.id}
                        className={`relative overflow-hidden rounded-xl border p-5 text-left transition-all duration-300 ${box.status === "OPENED"
                            ? "border-white/8 bg-slate-900/20 opacity-60"
                            : "border-emerald-400/40 bg-gradient-to-br from-emerald-500/15 to-slate-900/50 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:border-emerald-400/70"
                          }`}
                      >
                        {box.status === "AVAILABLE" && (
                          <div className="absolute inset-0 rounded-xl opacity-30"
                            style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.3) 0%, transparent 70%)" }}
                          />
                        )}
                        <div className="relative flex items-center gap-4">
                          <motion.div
                            animate={box.status === "AVAILABLE" ? { y: [0, -4, 0] } : {}}
                            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-3xl ${box.status === "OPENED" ? "bg-slate-800/40" : "bg-emerald-500/20 border border-emerald-400/30"
                              }`}
                          >
                            {box.status === "OPENED" ? "📦" : "🎁"}
                          </motion.div>
                          <div className="min-w-0">
                            <p className="font-bold text-white">Caixa #{box.personalNumber}</p>
                            {box.status === "OPENED" ? (
                              <p className="text-xs text-slate-400 mt-0.5">Ver o que estava dentro</p>
                            ) : (
                              <>
                                <p className="text-xs font-semibold text-emerald-300 mt-0.5">Toque para revelar</p>
                                <p className="text-xs text-slate-500 mt-0.5">Pode conter um prêmio surpresa</p>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/8 bg-slate-900/30 p-8 text-center">
                    <div className="text-4xl mb-3">🎁</div>
                    <p className="text-sm font-semibold text-slate-300 mb-1">Sua primeira caixa te espera</p>
                    <p className="text-xs text-slate-500 mb-4">Complete uma rifa para ganhar sua caixa misteriosa e descobrir o que tem dentro.</p>
                    <a href={`/${slug}`} className="inline-block rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-[#0B1120] hover:bg-emerald-400 transition-colors">
                      Participar de uma rifa →
                    </a>
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
                  <FileText size={20} className="text-emerald-400" />
                  <h2 className="text-lg font-semibold text-white">Histórico de Pagamentos</h2>
                </div>

                {payments && payments.length > 0 ? (
                  <div className="space-y-2">
                    {payments.map((payment) => (
                      <motion.button
                        key={payment.id}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.99 }}
                        type="button"
                        onClick={() => setSelectedPayment(payment)}
                        className="w-full flex items-center justify-between rounded-xl border border-white/8 bg-slate-900/40 px-4 py-3.5 text-left transition-all hover:border-emerald-500/30 hover:bg-slate-900/60 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 shrink-0 flex items-center justify-center rounded-lg ${payment.status === "COMPLETED" ? "bg-emerald-500/15" :
                              payment.status === "PENDING" ? "bg-amber-500/15" :
                                "bg-red-500/15"
                            }`}>
                            {payment.status === "COMPLETED" && <CheckCircle2 size={15} className="text-emerald-400" />}
                            {payment.status === "PENDING" && <Clock size={15} className="text-amber-400" />}
                            {(payment.status === "FAILED" || payment.status === "CANCELED") && <XCircle size={15} className="text-red-400" />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {payment.ticketCount} bilhete{payment.ticketCount > 1 ? "s" : ""}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(payment.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })} · {payment.method}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-bold text-white">
                            R$ {payment.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                          <ChevronRight size={14} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/8 bg-slate-900/30 p-8 text-center">
                    <FileText size={32} className="mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-semibold text-slate-300 mb-1">Nenhuma compra ainda</p>
                    <p className="text-xs text-slate-500">Seu histórico de pedidos aparecerá aqui após a primeira compra.</p>
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
                      <motion.button
                        key={raffle.id || raffle.slug}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedRaffleForTickets(raffle);
                          setIsTicketsModalOpen(true);
                        }}
                        className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/30 text-left transition-all hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10"
                      >
                        <div className="relative h-28 w-full bg-slate-800/60">
                          {raffle.image ? (
                            <img src={raffle.image} alt={raffle.title} className="h-full w-full object-cover" />
                          ) : null}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
                          <div className="absolute top-2 right-2">
                            {raffle.status === "ACTIVE" && (
                              <span className="flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
                                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                AO VIVO
                              </span>
                            )}
                            {raffle.status === "FINISHED" && (
                              <span className="rounded-full bg-slate-700/90 px-2 py-0.5 text-[10px] font-bold text-slate-300">ENCERRADA</span>
                            )}
                          </div>
                          <p className="absolute bottom-2 left-3 text-sm font-bold text-white">{raffle.title}</p>
                        </div>
                        <div className="flex items-center justify-between px-3 py-2 border-t border-white/5">
                          <p className="text-xs text-slate-400">
                            {(tickets || []).filter(t => t.raffle.id === raffle.id || t.raffle.slug === raffle.slug).length} bilhete{(tickets || []).filter(t => t.raffle.id === raffle.id || t.raffle.slug === raffle.slug).length !== 1 ? "s" : ""} seus
                          </p>
                          <span className="text-xs text-emerald-400 font-semibold">Ver números →</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/8 bg-slate-900/30 p-8 text-center">
                    <div className="text-4xl mb-3">🎯</div>
                    <p className="text-sm font-semibold text-slate-300 mb-1">Sua vitória está a um bilhete de distância</p>
                    <p className="text-xs text-slate-500 mb-4">Você ainda não participa de nenhuma rifa. Comece agora e entre no jogo.</p>
                    <a href={`/${slug}`} className="inline-block rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-[#0B1120] hover:bg-emerald-400 transition-colors">
                      Escolher minha rifa →
                    </a>
                  </div>
                )}
              </motion.section>
            </div>
        </div>
      </main>

      {/* Drawer: Editar Perfil */}
      <AnimatePresence>
        {isEditing && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsEditing(false)}
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 38 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col"
              style={{
                background: "rgba(10, 14, 24, 0.92)",
                backdropFilter: "blur(20px)",
                borderLeft: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "-32px 0 80px rgba(0,0,0,0.5)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-white/8">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-0.5">Sua identidade</p>
                  <h2 className="text-lg font-black text-white">Editar Perfil</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-white/8 hover:text-white transition-all"
                >
                  ×
                </button>
              </div>

              {/* Avatar preview */}
              <div className="px-6 py-5 border-b border-white/8">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Avatar</p>
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt="Preview"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        className="h-16 w-16 rounded-2xl object-cover border-2 border-emerald-400/30 shadow-lg shadow-emerald-500/10"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-2xl bg-slate-800 border-2 border-white/10 flex items-center justify-center">
                        <User size={24} className="text-slate-600" />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 border-2 border-[#0a0e18]">
                      <Camera size={9} className="text-[#0a0e18]" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      ref={avatarInputRef}
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder="Cole a URL da imagem..."
                      className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-xs text-zinc-200 placeholder:text-slate-600 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
                    />
                    <p className="text-[10px] text-slate-600 mt-1">Preview ao vivo à esquerda</p>
                  </div>
                </div>
              </div>

              {/* Form fields */}
              <form
                onSubmit={handleSaveProfile}
                className="flex flex-col flex-1 overflow-y-auto"
                style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(16,185,129,0.2) transparent" }}
              >
                <div className="px-6 py-5 space-y-5 flex-1">

                  {/* Float label field: Nome */}
                  <div className="relative">
                    <input
                      id="edit-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder=" "
                      className="peer w-full rounded-xl border border-white/10 bg-slate-800/50 px-4 pt-5 pb-2 text-sm text-zinc-100 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder-transparent"
                    />
                    <label
                      htmlFor="edit-name"
                      className="absolute left-4 top-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-placeholder-shown:text-slate-500 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-emerald-400"
                    >
                      Nome completo
                    </label>
                  </div>

                  {/* Float label field: Apelido */}
                  <div className="relative">
                    <input
                      id="edit-nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder=" "
                      className="peer w-full rounded-xl border border-white/10 bg-slate-800/50 px-4 pt-5 pb-2 text-sm text-zinc-100 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder-transparent"
                    />
                    <label
                      htmlFor="edit-nickname"
                      className="absolute left-4 top-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-placeholder-shown:text-slate-500 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-emerald-400"
                    >
                      Como quer ser chamado
                    </label>
                  </div>

                  {/* Float label field: Banner */}
                  <div className="relative">
                    <input
                      id="edit-banner"
                      value={banner}
                      onChange={(e) => setBanner(e.target.value)}
                      placeholder=" "
                      className="peer w-full rounded-xl border border-white/10 bg-slate-800/50 px-4 pt-5 pb-2 text-sm text-zinc-100 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder-transparent"
                    />
                    <label
                      htmlFor="edit-banner"
                      className="absolute left-4 top-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-placeholder-shown:text-slate-500 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-emerald-400"
                    >
                      Banner (URL)
                    </label>
                  </div>

                  {/* Email (readonly) */}
                  <div className="rounded-xl border border-white/5 bg-slate-900/40 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-0.5">Email</p>
                    <p className="text-sm text-slate-400 truncate">{email}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">Não pode ser alterado</p>
                  </div>

                </div>

                {/* Footer fixo */}
                <div className="px-6 pb-6 pt-4 border-t border-white/8 space-y-2 shrink-0">
                  <motion.button
                    type="submit"
                    disabled={isSaving || saveSuccess}
                    whileTap={!isSaving && !saveSuccess ? { scale: 0.97 } : {}}
                    className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                      saveSuccess
                        ? "bg-emerald-400 text-[#0B1120]"
                        : "bg-emerald-500 text-[#0B1120] hover:bg-emerald-400 disabled:opacity-70"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {saveSuccess ? (
                        <motion.span
                          key="ok"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 size={15} /> Salvo!
                        </motion.span>
                      ) : isSaving ? (
                        <motion.span
                          key="saving"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center justify-center gap-2"
                        >
                          <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                            <Loader2 size={14} />
                          </motion.span>
                          Salvando...
                        </motion.span>
                      ) : (
                        <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          Salvar alterações
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="w-full rounded-xl border border-white/8 px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white hover:border-white/15 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {isBoxModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25, type: "spring" }}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
          >
            {boxModalPhase === "opening" ? (
              <div className="flex flex-col items-center gap-5 text-center py-4">
                <motion.div
                  animate={{ rotate: [-6, 6, -6], y: [0, -8, 0], scale: [1, 1.08, 1] }}
                  transition={{ duration: 0.55, repeat: Infinity, ease: "easeInOut" }}
                  className="text-7xl select-none"
                >
                  🎁
                </motion.div>
                <div>
                  <p className="text-base font-bold text-white">Abrindo sua caixa...</p>
                  <p className="text-xs text-slate-400 mt-1">Seu destino está sendo revelado</p>
                </div>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                      className="h-2 w-2 rounded-full bg-emerald-400"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center justify-between w-full pb-3 border-b border-white/10">
                  <p className="text-xs uppercase tracking-wide font-bold text-slate-300">O que estava lá dentro</p>
                  <button type="button" onClick={() => setIsBoxModalOpen(false)} className="text-slate-400 hover:text-white text-lg leading-none">×</button>
                </div>

                <AnimatePresence mode="wait">
                  {boxModalMessage && boxModalMessage.toLowerCase().includes("vazia") ? (
                    <motion.div key="empty"
                      initial={{ scale: 0.8, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="w-full rounded-xl border-2 border-slate-500/30 bg-slate-800/30 p-6 flex flex-col items-center gap-3 text-center"
                    >
                      <div className="text-5xl">🪄</div>
                      <div>
                        <p className="text-base font-bold text-slate-300">Essa veio vazia...</p>
                        <p className="text-xs text-slate-500 mt-1">Mas a próxima pode mudar tudo!</p>
                      </div>
                      <a href={`/${slug}`} className="mt-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2">Comprar mais bilhetes →</a>
                    </motion.div>
                  ) : boxModalMessage === "Nao há premios instantaneos disponiveis no momento." || boxModalMessage?.includes("esgotado") ? (
                    <motion.div key="exhausted"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4 }}
                      className="w-full rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-900/20 p-6 flex flex-col items-center gap-3 text-center"
                    >
                      <div className="text-5xl">🏕️</div>
                      <p className="text-base font-bold text-amber-200">Todos os prêmios já foram!</p>
                      <p className="text-xs text-amber-300/70">Os prêmios desta rifa foram todos resgatados. Tente outra!</p>
                    </motion.div>
                  ) : (
                    <motion.div key="prize"
                      initial={{ scale: 0.7, opacity: 0, rotateY: 90 }}
                      animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                      transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                      className={`w-full rounded-xl border-2 p-6 flex flex-col items-center gap-4 text-center ${boxModalMessage?.includes("R$") || boxModalMessage?.includes("iPhone")
                          ? "border-amber-400/60 bg-gradient-to-br from-amber-500/20 to-slate-900/40 shadow-xl shadow-amber-500/20"
                          : "border-emerald-400/50 bg-gradient-to-br from-emerald-500/15 to-slate-900/30"
                        }`}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.12, 1], rotate: [0, 6, -6, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-6xl"
                      >
                        {boxModalMessage?.includes("R$") || boxModalMessage?.includes("iPhone") ? "🏆" : "🎉"}
                      </motion.div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">✨ Parabéns!</p>
                        <p className={`text-xl font-black leading-tight ${boxModalMessage?.includes("R$") || boxModalMessage?.includes("iPhone") ? "text-amber-100" : "text-emerald-100"
                          }`}>
                          {boxModalMessage}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">✓ Prêmio registrado na sua conta</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="button"
                  onClick={() => setIsBoxModalOpen(false)}
                  className="mt-4 w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-[#0B1120] hover:bg-emerald-400 transition-colors"
                >
                  Fechar
                </button>
              </div>
            )}
          </motion.div>
        </div>
      ) : null}

      {isTicketsModalOpen && selectedRaffleForTickets ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          onClick={() => { setIsTicketsModalOpen(false); setSelectedRaffleForTickets(null); }}
        >
          <motion.div
            initial={{ scale: 0.93, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.22, type: "spring" }}
            className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0e1624] shadow-2xl flex flex-col"
            style={{ maxHeight: "82vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header fixo */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8 shrink-0">
              <div>
                <h3 className="text-base font-bold text-white">{selectedRaffleForTickets.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedRaffleTickets.length} número{selectedRaffleTickets.length !== 1 ? "s" : ""} registrado{selectedRaffleTickets.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setIsTicketsModalOpen(false); setSelectedRaffleForTickets(null); }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/8 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>

            {/* Scroll personalizado */}
            <div
              className="overflow-y-auto px-5 py-4 flex-1"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(16,185,129,0.35) transparent",
              }}
            >
              {selectedRaffleTickets && selectedRaffleTickets.length > 0 ? (
                <>
                  {selectedRaffleForTickets.status === "FINISHED" && (
                    <p className="mb-3 text-xs text-slate-400">
                      Rifa finalizada
                      {selectedRaffleForTickets.winnerTicketNumber
                        ? ` — número vencedor em destaque (${selectedRaffleForTickets.winnerTicketNumber}).`
                        : "."}
                    </p>
                  )}
                  {selectedRaffleWinningTicket && (
                    <div className="mb-3 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2.5 flex items-center gap-2">
                      <span className="text-base">🏆</span>
                      <div>
                        <p className="text-xs font-bold text-amber-200">Seu número vencedor</p>
                        <p className="text-sm font-black text-amber-100">{selectedRaffleWinningTicket}</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {selectedRaffleTickets.map((ticket) => {
                      const isFinished = selectedRaffleForTickets.status === "FINISHED";
                      const winnerNumber = selectedRaffleForTickets.winnerTicketNumber ?? null;
                      const isHighlighted = Boolean(isFinished && winnerNumber && ticket.number === winnerNumber);
                      return (
                        <div
                          key={ticket.id}
                          className={`flex items-center justify-center rounded-lg border p-2 text-center text-sm font-bold transition-all ${isHighlighted
                              ? "border-amber-300/60 bg-amber-400/20 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.25)]"
                              : isFinished
                                ? "border-slate-600/20 bg-slate-900/30 text-slate-500"
                                : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                            }`}
                        >
                          {ticket.number}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400 text-center py-8">Nenhum bilhete encontrado para essa rifa</p>
              )}
            </div>

            {/* Footer fixo */}
            <div className="px-5 pb-5 pt-3 border-t border-white/8 shrink-0">
              <button
                type="button"
                onClick={() => { setIsTicketsModalOpen(false); setSelectedRaffleForTickets(null); }}
                className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-[#0B1120] hover:bg-emerald-400 transition-colors"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}

      {/* Modal de Rastreamento de Pedido */}
      <AnimatePresence>
        {selectedPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
            onClick={() => setSelectedPayment(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 8, opacity: 0 }}
              transition={{ duration: 0.25, type: "spring", stiffness: 260 }}
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0e1624] shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 pt-5 pb-4 border-b border-white/8 flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-0.5">Rastreamento do pedido</p>
                  <p className="text-base font-bold text-white">
                    {selectedPayment.ticketCount} bilhete{selectedPayment.ticketCount > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(selectedPayment.createdAt).toLocaleString("pt-BR", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                      hour: "2-digit", minute: "2-digit"
                    })} · {selectedPayment.method}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/8 hover:text-white transition-colors shrink-0"
                >
                  ×
                </button>
              </div>

              {/* Valor */}
              <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
                <p className="text-xs text-slate-400">Valor total</p>
                <p className="text-lg font-black text-white">
                  R$ {selectedPayment.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Timeline */}
              <div className="px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Etapas do pedido</p>
                {(() => {
                  const steps = [
                    {
                      key: "created",
                      label: "Pedido criado",
                      desc: "Sua solicitação foi recebida",
                      done: true,
                      icon: "📝",
                    },
                    {
                      key: "payment",
                      label: "Pagamento processado",
                      desc: selectedPayment.method === "PIX" ? "Via PIX" : `Via ${selectedPayment.method}`,
                      done: selectedPayment.status !== "PENDING",
                      pending: selectedPayment.status === "PENDING",
                      failed: selectedPayment.status === "FAILED" || selectedPayment.status === "CANCELED",
                      icon: selectedPayment.method === "PIX" ? "💸" : "💳",
                    },
                    {
                      key: "confirmed",
                      label: "Bilhetes confirmados",
                      desc: `${selectedPayment.ticketCount} número${selectedPayment.ticketCount > 1 ? "s" : ""} cadastrado${selectedPayment.ticketCount > 1 ? "s" : ""}`,
                      done: selectedPayment.status === "COMPLETED",
                      pending: selectedPayment.status === "PENDING",
                      failed: selectedPayment.status === "FAILED" || selectedPayment.status === "CANCELED",
                      icon: "🎟️",
                    },
                    {
                      key: "active",
                      label: "Participando da rifa",
                      desc: selectedPayment.status === "COMPLETED" ? "Você está na disputa! Boa sorte 🎉" : "Aguardando confirmação",
                      done: selectedPayment.status === "COMPLETED",
                      pending: selectedPayment.status === "PENDING",
                      failed: selectedPayment.status === "FAILED" || selectedPayment.status === "CANCELED",
                      icon: "🎯",
                    },
                  ];
                  return (
                    <div className="relative">
                      {steps.map((step, i) => {
                        const isLast = i === steps.length - 1;
                        return (
                          <div key={step.key} className="flex gap-4">
                            {/* Linha + dot */}
                            <div className="flex flex-col items-center">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: i * 0.1, type: "spring", stiffness: 300 }}
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm transition-all ${step.failed
                                    ? "border-red-500/60 bg-red-500/15 text-red-300"
                                    : step.done
                                      ? "border-emerald-400/60 bg-emerald-500/15"
                                      : step.pending
                                        ? "border-amber-400/50 bg-amber-500/10"
                                        : "border-slate-600/40 bg-slate-800/40"
                                  }`}
                              >
                                {step.failed ? (
                                  <XCircle size={13} className="text-red-400" />
                                ) : step.done ? (
                                  <CheckCircle2 size={13} className="text-emerald-400" />
                                ) : step.pending ? (
                                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
                                    <Loader2 size={13} className="text-amber-400" />
                                  </motion.div>
                                ) : (
                                  <span className="text-xs">{step.icon}</span>
                                )}
                              </motion.div>
                              {!isLast && (
                                <div className={`w-0.5 flex-1 my-1 rounded-full ${step.done ? "bg-emerald-500/40" : "bg-slate-700/60"
                                  }`}
                                  style={{ minHeight: "20px" }}
                                />
                              )}
                            </div>
                            {/* Texto */}
                            <div className={`pb-5 ${isLast ? "pb-0" : ""}`}>
                              <p className={`text-sm font-semibold leading-tight ${step.failed ? "text-red-300" :
                                  step.done ? "text-white" :
                                    step.pending ? "text-amber-200" :
                                      "text-slate-500"
                                }`}>{step.label}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Footer */}
              <div className="px-5 pb-5">
                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-[#0B1120] hover:bg-emerald-400 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
