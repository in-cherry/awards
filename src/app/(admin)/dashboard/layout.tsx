import Link from "next/link";
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAuthUser } from "@/lib/auth/mddleware";
import { getActiveTenantCookieName } from "@/lib/auth/jwt";
import prisma from "@/lib/database/prisma";
import { UserMenu } from "./_components/user-menu";
import { Logo } from "@/components/ui/logo";
import { TenantSwitcher } from "./_components/tenant-switcher";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: {
      name: true,
      email: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const activeTenantSlug = cookieStore.get(getActiveTenantCookieName())?.value;
  let activeTenantName = "Nenhuma organização ativa";

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
    select: {
      slug: true,
      name: true,
    },
  });

  if (activeTenantSlug) {
    const activeTenant = tenants.find((tenant) => tenant.slug === activeTenantSlug);

    if (activeTenant) {
      activeTenantName = activeTenant.name;
    }
  }

  const hasOrganizations = tenants.length > 0;

  return (
    <div className="relative min-h-screen bg-[#0b1220] text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.1),transparent_34%)]" />

      <div className="relative mx-auto flex min-h-screen">
        {hasOrganizations ? (
          <aside className="hidden w-72 border-r border-white/10 bg-slate-950/70 p-5 lg:flex lg:flex-col">
            <div className="mb-8 flex items-center gap-3">
              <Logo />
              <div>
                <p className="text-sm font-semibold tracking-wide text-zinc-100">Winzy</p>
                <p className="text-xs text-slate-400">Painel de Controle</p>
              </div>
            </div>

            <nav className="space-y-1">
              <Link
                href="/dashboard"
                className="flex items-center rounded-xl px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-white/5"
              >
                Home
              </Link>
              <Link
                href="/dashboard/organizations"
                className="flex items-center rounded-xl px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-white/5"
              >
                Organizacoes
              </Link>
              <Link
                href="/dashboard/raffles"
                className="flex items-center rounded-xl px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-white/5"
              >
                Rifas
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex items-center rounded-xl px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-white/5"
              >
                Configuracoes
              </Link>
            </nav>
          </aside>
        ) : null}

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="relative z-40 border-b border-white/10 bg-slate-950/45 px-4 py-3 backdrop-blur-sm md:px-7">
            <div className="flex items-center justify-between gap-4">
              {hasOrganizations ? (
                <div className="flex items-center gap-3">
                  <TenantSwitcher activeTenantName={activeTenantName} tenants={tenants} />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Logo />
                  <p className="text-sm text-slate-300">Suas organizacoes</p>
                </div>
              )}

              <UserMenu name={user.name} email={user.email} />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-7">{children}</main>
        </div>
      </div>
    </div>
  );
}