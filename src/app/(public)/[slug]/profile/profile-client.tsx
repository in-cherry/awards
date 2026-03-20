"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  error?: string;
};

type ClientProfileViewProps = {
  slug: string;
};

export function ClientProfileView({ slug }: ClientProfileViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("");
  const [email, setEmail] = useState("");

  const [summary, setSummary] = useState<MeResponse["summary"]>();
  const [tickets, setTickets] = useState<MeResponse["tickets"]>([]);
  const [raffles, setRaffles] = useState<MeResponse["raffles"]>([]);
  const [prizes, setPrizes] = useState<MeResponse["prizes"]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

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
      setNickname(data.client.nickname || "");
      setAvatar(data.client.avatar || "");
      setEmail(data.client.email);

      setSummary(data.summary);
      setTickets(data.tickets || []);
      setRaffles(data.raffles || []);
      setPrizes(data.prizes || []);
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
        body: JSON.stringify({ slug, name, nickname, avatar }),
      });

      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        setError(data.error || "Nao foi possivel salvar perfil.");
        return;
      }

      setMessage("Perfil atualizado com sucesso.");
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
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 py-10">
        <p className="text-sm text-slate-300">Carregando seu perfil...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6 md:py-10">
      <header className="mb-6 rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Area do participante</p>
        <h1 className="mt-2 text-2xl font-bold uppercase text-zinc-100">Meu perfil</h1>
        <p className="mt-2 text-sm text-slate-300">Organizacao: /{slug}</p>
      </header>

      {error && <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {message && <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{message}</p>}

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <p className="text-xs uppercase tracking-widest text-slate-400">Bilhetes totais</p>
          <p className="mt-2 text-3xl font-bold text-zinc-100">{summary?.totalTickets ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <p className="text-xs uppercase tracking-widest text-slate-400">Rifas participadas</p>
          <p className="mt-2 text-3xl font-bold text-zinc-100">{summary?.rafflesParticipated ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <p className="text-xs uppercase tracking-widest text-slate-400">Premios ganhos</p>
          <p className="mt-2 text-3xl font-bold text-zinc-100">{summary?.winsCount ?? 0}</p>
        </article>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <article className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
            <h2 className="text-lg font-semibold text-zinc-100">Seus bilhetes</h2>
            <div className="mt-4 grid gap-2">
              {tickets && tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2"
                  >
                    <div>
                      <p className="font-mono text-sm text-cyan-300">#{ticket.number}</p>
                      <p className="text-xs text-slate-400">{ticket.raffle.title}</p>
                    </div>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-300">{ticket.status}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">Voce ainda nao possui bilhetes.</p>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
            <h2 className="text-lg font-semibold text-zinc-100">Premios</h2>
            <div className="mt-4 grid gap-2">
              {prizes && prizes.length > 0 ? (
                prizes.map((prize) => (
                  <div key={prize.id} className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2">
                    <p className="text-sm font-medium text-zinc-100">{prize.title}</p>
                    <p className="text-xs text-slate-400">{prize.raffleTitle || "Rifa"}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">Nenhum premio registrado ainda.</p>
              )}
            </div>
          </article>
        </div>

        <aside className="space-y-6">
          <article className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
            <h2 className="text-lg font-semibold text-zinc-100">Editar perfil</h2>
            <form className="mt-4 grid gap-3" onSubmit={handleSaveProfile}>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nome"
                className="rounded-xl border border-white/10 bg-slate-800/70 px-3 py-2 text-sm text-zinc-100"
              />
              <input
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="Apelido"
                className="rounded-xl border border-white/10 bg-slate-800/70 px-3 py-2 text-sm text-zinc-100"
              />
              <input
                value={avatar}
                onChange={(event) => setAvatar(event.target.value)}
                placeholder="URL do avatar"
                className="rounded-xl border border-white/10 bg-slate-800/70 px-3 py-2 text-sm text-zinc-100"
              />
              <input
                value={email}
                disabled
                className="cursor-not-allowed rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-400"
              />

              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-700 disabled:opacity-70"
              >
                {isSaving ? "Salvando..." : "Salvar alteracoes"}
              </button>
            </form>
          </article>

          <article className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
            <h2 className="text-lg font-semibold text-zinc-100">Acoes</h2>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={() => router.push(`/${slug}`)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
              >
                Voltar para pagina publica
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200 hover:bg-red-500/20"
              >
                Sair
              </button>
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
            <h2 className="text-lg font-semibold text-zinc-100">Rifas ativas</h2>
            <div className="mt-4 grid gap-2">
              {raffles && raffles.length > 0 ? (
                raffles.map((raffle) => (
                  <button
                    key={raffle.id}
                    type="button"
                    onClick={() => router.push(`/${slug}`)}
                    className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5"
                  >
                    {raffle.title}
                  </button>
                ))
              ) : (
                <p className="text-sm text-slate-400">Nenhuma rifa encontrada.</p>
              )}
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}
