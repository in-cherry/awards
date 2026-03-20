import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import prisma from "@/lib/database/prisma";
import { getAuthUser } from "@/lib/auth/mddleware";
import { getActiveTenantCookieName } from "@/lib/auth/jwt";

function parsePercentage(rawValue: string | undefined, fallback = 10): number {
  if (!rawValue) return fallback;
  const numeric = Number(rawValue.replace(",", "."));
  if (Number.isNaN(numeric)) return fallback;
  return Math.min(Math.max(numeric, 0), 100);
}

export default async function DashboardHomePage() {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const activeTenantSlug = cookieStore.get(getActiveTenantCookieName())?.value;

  const totalTenants = await prisma.tenant.count({
    where: {
      OR: [
        { ownerId: authUser.userId },
        {
          members: {
            some: {
              userId: authUser.userId,
              revokedAt: null,
            },
          },
        },
      ],
    },
  });

  if (totalTenants === 0) {
    redirect("/dashboard/organizations");
  }

  if (!activeTenantSlug) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-lg backdrop-blur-sm">
        <h1 className="text-2xl font-mono font-bold uppercase text-zinc-100">Home</h1>
        <p className="mt-3 text-sm text-slate-300">
          Selecione uma organizacao pela badge no topo para visualizar os ganhos e metricas.
        </p>
      </div>
    );
  }

  const tenant = await prisma.tenant.findFirst({
    where: {
      slug: activeTenantSlug,
      OR: [
        { ownerId: authUser.userId },
        {
          members: {
            some: {
              userId: authUser.userId,
              revokedAt: null,
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      raffles: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          tickets: {
            select: {
              payment: {
                select: {
                  totalValue: true,
                  status: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!tenant) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-lg backdrop-blur-sm">
        <h1 className="text-2xl font-mono font-bold uppercase text-zinc-100">Home</h1>
        <p className="mt-3 text-sm text-slate-300">A organizacao ativa nao foi encontrada ou voce nao tem acesso.</p>
      </div>
    );
  }

  const feePercentage = parsePercentage(process.env.PLATFORM_FEE_PERCENTAGE, 10);

  const raffleSummaries = tenant.raffles.map((raffle) => {
    const gross = raffle.tickets.reduce((acc: number, ticket) => {
      if (!ticket.payment || ticket.payment.status !== "COMPLETED") return acc;
      return acc + Number(ticket.payment.totalValue);
    }, 0);
    const net = gross * (1 - feePercentage / 100);

    return {
      id: raffle.id,
      name: raffle.name,
      status: raffle.status,
      gross,
      net,
    };
  });

  const totalGross = raffleSummaries.reduce((acc, raffle) => acc + raffle.gross, 0);
  const totalNet = raffleSummaries.reduce((acc, raffle) => acc + raffle.net, 0);
  const maxGross = raffleSummaries.reduce((acc, raffle) => Math.max(acc, raffle.gross), 0);

  const formatCurrency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 shadow-lg backdrop-blur-sm md:p-6">
      <div className="mb-6 border-b border-slate-500/20 pb-4">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-slate-400">Painel administrativo</p>
        <h1 className="mt-2 text-2xl font-mono font-bold uppercase text-zinc-200 md:text-3xl">Home</h1>
        <p className="mt-2 text-sm text-slate-300">
          Visao geral de ganhos da organizacao {tenant.name}, com desconto de taxa de plataforma ({feePercentage}%).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">Total bruto</p>
          <p className="mt-2 text-xl font-semibold text-zinc-100">{formatCurrency.format(totalGross)}</p>
        </div>
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
          <p className="text-xs uppercase tracking-wider text-emerald-300">Total liquido</p>
          <p className="mt-2 text-xl font-semibold text-emerald-200">{formatCurrency.format(totalNet)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">Rifas</p>
          <p className="mt-2 text-xl font-semibold text-zinc-100">{raffleSummaries.length}</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-slate-950/40 p-4">
        <p className="mb-4 text-sm font-semibold text-zinc-100">Ganhos por rifa</p>

        {raffleSummaries.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma rifa cadastrada ainda.</p>
        ) : (
          <div className="space-y-3">
            {raffleSummaries.map((raffle) => {
              const barPercent = maxGross > 0 ? (raffle.gross / maxGross) * 100 : 0;

              return (
                <div key={raffle.id} className="grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm text-zinc-200">{raffle.name}</p>
                    <p className="text-xs text-slate-400">{formatCurrency.format(raffle.gross)}</p>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                      style={{ width: `${Math.max(barPercent, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
