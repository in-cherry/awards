"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { formatNumber, formatRaffleCreatedAt } from "@/lib/utils";

type RaffleItem = {
  id: string;
  name: string;
  slug: string;
  banner: string | null;
  pixValue: number;
  priceTicket: number;
  minTickets: number;
  maxTickets: number;
  status: "DRAFT" | "ACTIVE" | "FINISHED" | "CANCELED";
  createdAt: string;
};

type RafflesResponse = {
  success: boolean;
  mercadoPagoConnected?: boolean;
  raffles?: RaffleItem[];
  tenant?: {
    name: string;
    slug: string;
  };
  error?: string;
};

type RaffleForm = {
  banner: string;
  name: string;
  description: string;
  slug: string;
  pixValue: string;
  priceTicket: string;
  minTickets: string;
  maxTickets: string;
};

type MysteryPrizeDraft = {
  id: string;
  name: string;
  value: string;
};

type EditableField =
  | "banner"
  | "name"
  | "description"
  | "slug"
  | "priceTicket"
  | "pixValue"
  | "minTickets"
  | "maxTickets"
  | null;

const initialForm: RaffleForm = {
  banner: "",
  name: "",
  description: "",
  slug: "",
  pixValue: "0",
  priceTicket: "1",
  minTickets: "100",
  maxTickets: "1000000",
};

export default function DashboardRafflesPage() {
  const [raffles, setRaffles] = useState<RaffleItem[]>([]);
  const [form, setForm] = useState<RaffleForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [mercadoPagoConnected, setMercadoPagoConnected] = useState(false);
  const [tenantName, setTenantName] = useState("Sua organizacao");
  const [tenantSlug, setTenantSlug] = useState("seu-slug");
  const [editingField, setEditingField] = useState<EditableField>(null);
  const [raffleToDelete, setRaffleToDelete] = useState<RaffleItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [mysteryPrizes, setMysteryPrizes] = useState<MysteryPrizeDraft[]>([]);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
    [],
  );

  const pixHelpText = useMemo(() => {
    const hasPix = Number(form.pixValue) > 0;
    return hasPix
      ? "Opcional PIX habilitado para o cliente escolher valor em dinheiro no lugar do premio."
      : "Sem opcao PIX adicional para esta rifa.";
  }, [form.pixValue]);

  async function loadRaffles() {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/raffles");
      const data = (await response.json()) as RafflesResponse;

      if (!response.ok || !data.success) {
        setMessage(data.error || "Nao foi possivel carregar as rifas.");
        return;
      }

      setMercadoPagoConnected(Boolean(data.mercadoPagoConnected));
      if (data.tenant?.name) setTenantName(data.tenant.name);
      if (data.tenant?.slug) setTenantSlug(data.tenant.slug);
      setRaffles(data.raffles || []);
    } catch {
      setMessage("Erro de conexao ao carregar rifas.");
    } finally {
      setLoading(false);
    }
  }

  const checkoutMinPreview = useMemo(() => {
    const minTickets = Math.max(Number(form.minTickets || 1), 1);
    const price = Math.max(Number(form.priceTicket || 0), 0);
    return {
      minTickets,
      total: minTickets * price,
    };
  }, [form.minTickets, form.priceTicket]);

  useEffect(() => {
    loadRaffles();
  }, []);

  async function createRaffle() {
    if (!mercadoPagoConnected) {
      setMessage("Conecte o Mercado Pago em Configuracoes antes de criar uma rifa.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/dashboard/raffles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          pixValue: Number(form.pixValue),
          priceTicket: Number(form.priceTicket),
          minTickets: Number(form.minTickets),
          maxTickets: Number(form.maxTickets),
          mysteryPrizes: mysteryPrizes
            .map((prize) => ({
              name: prize.name.trim(),
              value: Number(prize.value),
            }))
            .filter((prize) => prize.name && Number.isFinite(prize.value) && prize.value > 0),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.error || "Nao foi possivel criar a rifa.");
        return;
      }

      setForm(initialForm);
      setMysteryPrizes([]);
      setMessage("Rifa criada com sucesso.");
      await loadRaffles();
    } catch {
      setMessage("Erro de conexao ao criar rifa.");
    } finally {
      setSaving(false);
    }
  }

  function handleRaffleClose(raffle: RaffleItem) {
    setRaffleToDelete(raffle);
  }

  async function confirmDeleteRaffle() {
    if (!raffleToDelete) return;

    const raffleTarget = raffleToDelete;
    const previousRaffles = raffles;

    setDeleting(true);
    setMessage("");
    setRaffleToDelete(null);
    setRaffles((current) => current.filter((item) => item.id !== raffleTarget.id));

    try {
      const response = await fetch(`/api/dashboard/raffles?raffleId=${encodeURIComponent(raffleTarget.id)}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !data.success) {
        setRaffles(previousRaffles);
        setMessage(data.error || "Nao foi possivel remover a rifa.");
        return;
      }

      setMessage("Rifa removida com sucesso.");
    } catch {
      setRaffles(previousRaffles);
      setMessage("Erro de conexao ao remover rifa.");
    } finally {
      setDeleting(false);
    }
  }

  function beginEdit(field: Exclude<EditableField, null>) {
    setEditingField(field);
  }

  function endEdit() {
    setEditingField(null);
  }

  function addMysteryPrize() {
    setMysteryPrizes((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: "",
        value: "",
      },
    ]);
  }

  function removeMysteryPrize(id: string) {
    setMysteryPrizes((current) => current.filter((prize) => prize.id !== id));
  }

  function updateMysteryPrize(id: string, field: "name" | "value", value: string) {
    setMysteryPrizes((current) =>
      current.map((prize) => (prize.id === id ? { ...prize, [field]: value } : prize)),
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 shadow-lg backdrop-blur-sm md:p-6">
      <div className="mb-6 border-b border-slate-500/20 pb-4">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-slate-400">Painel administrativo</p>
        <h1 className="mt-2 text-2xl font-mono font-bold uppercase text-zinc-200 md:text-3xl">Rifas</h1>
        <p className="mt-2 text-sm text-slate-300">Crie e gerencie rifas de forma dinamica e interativa.</p>
      </div>

      {!mercadoPagoConnected && (
        <div className="mb-6 rounded-xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <p className="font-medium">Conexao Mercado Pago obrigatoria</p>
          <p className="mt-1 text-amber-100/90">
            Para criar rifas, conecte primeiro a conta da organizacao no Mercado Pago.
          </p>
          <Link
            href="/dashboard/settings"
            className="mt-3 inline-flex rounded-lg bg-amber-500/90 px-3 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400"
          >
            Ir para Configuracoes
          </Link>
        </div>
      )}

      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-xl border border-white/10 bg-slate-950/45 p-4">
          <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Nova rifa</p>
            </div>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
              ACTIVE
            </span>
          </div>

          <div className="rounded-xl border border-slate-500/10 bg-[#0b1220] p-4">
            <div className="grid gap-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">URL do banner</p>
              {editingField === "banner" ? (
                <input
                  autoFocus
                  value={form.banner}
                  onBlur={endEdit}
                  onChange={(event) => setForm((prev) => ({ ...prev, banner: event.target.value }))}
                  placeholder="https://.../banner.png"
                  className="rounded-lg border border-cyan-400/30 bg-slate-800/70 px-3 py-2 text-sm text-zinc-100 outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => beginEdit("banner")}
                  className="rounded-lg border border-white/10 bg-slate-800/60 px-3 py-2 text-left text-sm text-slate-300 hover:border-cyan-300/30"
                >
                  {form.banner.trim() || "Clique para inserir a URL do banner"}
                </button>
              )}
            </div>

            <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
              <div
                className="h-40 bg-slate-800/60 bg-cover bg-center"
                style={form.banner.trim() ? { backgroundImage: `url(${form.banner.trim()})` } : undefined}
              >
                {!form.banner.trim() && (
                  <div className="flex h-full items-center justify-center text-xs uppercase tracking-wide text-slate-500">
                    Banner da rifa
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/55 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Nome da rifa</p>
              {editingField === "name" ? (
                <input
                  autoFocus
                  value={form.name}
                  onBlur={endEdit}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Ex: MOTO CG TITAN 160 2020/21"
                  className="mt-2 w-full rounded-lg border border-cyan-400/30 bg-slate-800/70 px-3 py-2 text-sm text-zinc-100 outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => beginEdit("name")}
                  className="mt-2 text-left text-lg font-semibold uppercase text-zinc-100 hover:text-cyan-200"
                >
                  {form.name.trim() || "Sua nova rifa"}
                </button>
              )}
            </div>

            <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/55 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Descricao</p>
              {editingField === "description" ? (
                <textarea
                  autoFocus
                  value={form.description}
                  onBlur={endEdit}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Descreva regras, data de sorteio e observacoes importantes."
                  className="mt-2 min-h-24 w-full rounded-lg border border-cyan-400/30 bg-slate-800/70 px-3 py-2 text-sm text-zinc-100 outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => beginEdit("description")}
                  className="mt-2 text-left text-sm text-slate-300 hover:text-zinc-100"
                >
                  {form.description.trim() ||
                    "Descreva os detalhes da rifa, regras de participacao, data do sorteio e observacoes importantes para os compradores."}
                </button>
              )}
            </div>

            <div className="mt-3 grid gap-2">
              <label htmlFor="raffle-slug" className="text-[11px] uppercase tracking-wide text-slate-400">
                Slug (opcional)
              </label>
              {editingField === "slug" ? (
                <input
                  id="raffle-slug"
                  autoFocus
                  value={form.slug}
                  onBlur={endEdit}
                  onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
                  placeholder="moto-cg-titan-160"
                  className="rounded-lg border border-cyan-400/30 bg-slate-800/70 px-3 py-2 text-sm text-zinc-100"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => beginEdit("slug")}
                  className="rounded-lg border border-white/10 bg-slate-800/60 px-3 py-2 text-left text-sm text-slate-300 hover:border-cyan-300/30"
                >
                  {form.slug.trim() || "Clique para definir o slug"}
                </button>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-slate-900/55 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Valor do ticket</p>
                {editingField === "priceTicket" ? (
                  <input
                    autoFocus
                    type="number"
                    step="0.01"
                    value={form.priceTicket}
                    onBlur={endEdit}
                    onChange={(event) => setForm((prev) => ({ ...prev, priceTicket: event.target.value }))}
                    placeholder="1.00"
                    className="mt-2 w-full rounded-lg border border-cyan-400/30 bg-slate-800/70 px-3 py-2 text-sm text-zinc-100"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => beginEdit("priceTicket")}
                    className="mt-2 text-left text-2xl font-semibold text-zinc-100 hover:text-cyan-200"
                  >
                    {currencyFormatter.format(Math.max(Number(form.priceTicket || 0), 0))}
                  </button>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900/55 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Opcao PIX</p>
                {editingField === "pixValue" ? (
                  <input
                    autoFocus
                    type="number"
                    step="0.01"
                    value={form.pixValue}
                    onBlur={endEdit}
                    onChange={(event) => setForm((prev) => ({ ...prev, pixValue: event.target.value }))}
                    placeholder="0.00"
                    className="mt-2 w-full rounded-lg border border-cyan-400/30 bg-slate-800/70 px-3 py-2 text-sm text-zinc-100"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => beginEdit("pixValue")}
                    className="mt-2 text-left text-2xl font-semibold text-zinc-100 hover:text-cyan-200"
                  >
                    {currencyFormatter.format(Math.max(Number(form.pixValue || 0), 0))}
                  </button>
                )}
              </div>
            </div>

            <p className="mt-2 text-xs text-slate-400">{pixHelpText}</p>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-slate-900/55 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Minimo de tickets</p>
                {editingField === "minTickets" ? (
                  <input
                    autoFocus
                    type="number"
                    value={form.minTickets}
                    onBlur={endEdit}
                    onChange={(event) => setForm((prev) => ({ ...prev, minTickets: event.target.value }))}
                    placeholder="100"
                    className="mt-2 w-full rounded-lg border border-cyan-400/30 bg-slate-800/70 px-3 py-2 text-sm text-zinc-100"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => beginEdit("minTickets")}
                    className="mt-2 text-left text-lg font-semibold text-zinc-100 hover:text-cyan-200"
                  >
                    {formatNumber(Math.max(Number(form.minTickets || 1), 1))}
                  </button>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900/55 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Maximo de tickets</p>
                {editingField === "maxTickets" ? (
                  <input
                    autoFocus
                    type="number"
                    value={form.maxTickets}
                    onBlur={endEdit}
                    onChange={(event) => setForm((prev) => ({ ...prev, maxTickets: event.target.value }))}
                    placeholder="1000000"
                    className="mt-2 w-full rounded-lg border border-cyan-400/30 bg-slate-800/70 px-3 py-2 text-sm text-zinc-100"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => beginEdit("maxTickets")}
                    className="mt-2 text-left text-lg font-semibold text-zinc-100 hover:text-cyan-200"
                  >
                    {formatNumber(Math.max(Number(form.maxTickets || 1), 1))}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/55 p-3">
              <p className="text-[11px] uppercase text-slate-500">Simulacao de checkout minimo</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-slate-300">{formatNumber(checkoutMinPreview.minTickets)} ticket(s)</p>
                <p className="text-base font-bold text-emerald-300">
                  {currencyFormatter.format(checkoutMinPreview.total)}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/55 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Premios instantaneos das caixas</p>
                <button
                  type="button"
                  onClick={addMysteryPrize}
                  className="rounded-md border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/20"
                >
                  + Adicionar premio
                </button>
              </div>

              {mysteryPrizes.length === 0 ? (
                <p className="mt-3 text-xs text-slate-400">Nenhum premio instantaneo adicionado.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {mysteryPrizes.map((prize, index) => (
                    <div key={prize.id} className="grid grid-cols-1 gap-2 rounded-lg border border-white/10 bg-slate-950/50 p-2 md:grid-cols-[1fr_160px_auto]">
                      <input
                        value={prize.name}
                        onChange={(event) => updateMysteryPrize(prize.id, "name", event.target.value)}
                        placeholder={`Premio ${index + 1}`}
                        className="rounded-md border border-white/15 bg-slate-800/70 px-2 py-1.5 text-xs text-zinc-100"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={prize.value}
                        onChange={(event) => updateMysteryPrize(prize.id, "value", event.target.value)}
                        placeholder="Valor (R$)"
                        className="rounded-md border border-white/15 bg-slate-800/70 px-2 py-1.5 text-xs text-zinc-100"
                      />
                      <button
                        type="button"
                        onClick={() => removeMysteryPrize(prize.id)}
                        className="rounded-md border border-red-400/30 bg-red-500/10 px-2 py-1.5 text-xs text-red-300 hover:bg-red-500/20"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={createRaffle}
              disabled={saving || !mercadoPagoConnected}
              className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Criando..." : !mercadoPagoConnected ? "Conecte o Mercado Pago para criar" : "Criar rifa"}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-950/45 p-4">
          <h2 className="text-sm font-semibold text-zinc-100">Rifas cadastradas</h2>

          {loading ? (
            <p className="mt-3 text-sm text-slate-400">Carregando...</p>
          ) : raffles.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">Nenhuma rifa cadastrada ainda.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {raffles.map((raffle) => (
                <div key={raffle.id} className="group rounded-lg border border-white/10 bg-slate-900/70 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-100">{raffle.name}</p>
                      <p className="mt-1 text-xs text-slate-400">/{raffle.slug}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{formatRaffleCreatedAt(raffle.createdAt)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-slate-300">
                        {raffle.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRaffleClose(raffle)}
                        aria-label={`Fechar ${raffle.name}`}
                        className="opacity-0 transition-opacity group-hover:opacity-100 rounded-md border border-white/15 p-1 text-slate-300 hover:bg-white/10 hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {raffleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-zinc-100">Confirmar remocao</h3>
            <p className="mt-2 text-sm text-slate-300">
              Deseja remover a rifa <span className="font-semibold text-zinc-100">{raffleToDelete.name}</span>?
            </p>
            <p className="mt-1 text-xs text-slate-400">Essa acao nao pode ser desfeita.</p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setRaffleToDelete(null)}
                className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteRaffle}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Removendo..." : "Remover"}
              </button>
            </div>
          </div>
        </div>
      )}

      {message && <p className="mt-4 text-sm text-slate-300">{message}</p>}
    </div>
  );
}
