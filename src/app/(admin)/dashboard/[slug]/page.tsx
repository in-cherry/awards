import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/mddleware";
import prisma from "@/lib/database/prisma";
import { cookies } from "next/headers";
import { getActiveTenantCookieName } from "@/lib/auth/jwt";

interface TenantDashboardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TenantDashboardPage({ params }: TenantDashboardPageProps) {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect("/login");
  }

  const { slug } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
        },
      },
      members: {
        where: {
          userId: authUser.userId,
          revokedAt: null,
        },
        select: {
          role: true,
        },
      },
    },
  });

  if (!tenant) {
    notFound();
  }

  const isOwner = tenant.ownerId === authUser.userId;
  const memberRole = tenant.members[0]?.role;
  const canAccess = isOwner || Boolean(memberRole);

  if (!canAccess) {
    notFound();
  }

  const roleLabel = isOwner ? "OWNER" : memberRole;
  const cookieStore = await cookies();
  const activeTenantSlug = cookieStore.get(getActiveTenantCookieName())?.value;

  if (activeTenantSlug !== tenant.slug) {
    redirect(`/dashboard/select/${tenant.slug}`);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 shadow-lg backdrop-blur-sm md:p-6">
      <div className="mb-6 border-b border-white/10 pb-4">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-slate-400">Workspace da organização</p>
        <h1 className="mt-2 text-2xl font-mono font-bold uppercase text-zinc-200 md:text-3xl">{tenant.name}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">Slug</p>
          <p className="mt-2 text-sm text-zinc-100">/{tenant.slug}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">Permissão</p>
          <p className="mt-2 text-sm text-zinc-100">{roleLabel}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">Responsável</p>
          <p className="mt-2 text-sm text-zinc-100">{tenant.owner.name}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-xl border border-slate-500/40 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-slate-400"
        >
          Ver organizações
        </Link>
        <Link
          href={`/${tenant.slug}`}
          className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Abrir página pública
        </Link>
      </div>
    </div>
  );
}