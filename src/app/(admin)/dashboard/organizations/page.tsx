import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/mddleware";
import { getActiveTenantCookieName } from "@/lib/auth/jwt";
import prisma from "@/lib/database/prisma";
import { TenantManagement } from "../tenant-management";

export default async function DashboardOrganizationsPage() {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const activeTenantSlug = cookieStore.get(getActiveTenantCookieName())?.value;

  const tenants = await prisma.tenant.findMany({
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
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      ownerId: true,
      createdAt: true,
      members: {
        where: { revokedAt: null },
        select: { id: true },
      },
      invites: {
        where: {
          acceptedAt: null,
          canceledAt: null,
        },
        select: { id: true },
      },
    },
  });

  const tenantRows = tenants.map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    role: tenant.ownerId === authUser.userId ? "OWNER" : "MEMBER",
    membersCount: tenant.members.length + 1,
    pendingInvites: tenant.invites.length,
    plan: "Free",
    createdAt: tenant.createdAt.toISOString(),
  }));

  const activeTenant = tenantRows.find((tenant) => tenant.slug === activeTenantSlug) || null;

  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="mb-6 overflow-hidden rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-slate-900/60 p-5 shadow-[0_18px_50px_-18px_rgba(8,145,178,0.55)] backdrop-blur-sm md:p-6">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-200/85">Painel administrativo</p>
        <h1 className="mt-2 text-2xl font-mono font-bold uppercase text-zinc-100 md:text-3xl">Suas organizacoes</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-200">
          Estruture seu ambiente criando uma nova organizacao ou assumindo o controle das organizacoes que ja fazem parte da sua conta.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/15 bg-slate-900/45 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Total de organizacoes</p>
            <p className="mt-1 text-xl font-semibold text-zinc-100">{tenantRows.length}</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-slate-900/45 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Organizacao ativa</p>
            <p className="mt-1 truncate text-sm font-semibold text-zinc-100">{activeTenant?.name || "Nenhuma ativa"}</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-slate-900/45 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Perfil predominante</p>
            <p className="mt-1 text-sm font-semibold text-zinc-100">
              {tenantRows.some((tenant) => tenant.role === "OWNER") ? "Owner" : "Membro"}
            </p>
          </div>
        </div>
      </div>

      <TenantManagement tenants={tenantRows} activeTenantSlug={activeTenantSlug} />
    </section>
  );
}
