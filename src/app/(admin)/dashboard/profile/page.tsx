import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/mddleware";
import prisma from "@/lib/database/prisma";

export default async function ProfilePage() {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: {
      name: true,
      email: true,
      phone: true,
      cpf: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 shadow-lg backdrop-blur-sm md:p-6">
      <div className="mb-6 border-b border-white/10 pb-4">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-slate-400">Conta</p>
        <h1 className="mt-2 text-2xl font-mono font-bold uppercase text-zinc-200 md:text-3xl">Perfil do usuário</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">Nome</p>
          <p className="mt-2 text-sm text-zinc-100">{user.name}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">E-mail</p>
          <p className="mt-2 text-sm text-zinc-100">{user.email}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">Telefone</p>
          <p className="mt-2 text-sm text-zinc-100">{user.phone || "-"}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">CPF</p>
          <p className="mt-2 text-sm text-zinc-100">{user.cpf || "-"}</p>
        </div>
      </div>
    </div>
  );
}