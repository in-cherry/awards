"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type AuthResponse = {
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
  error?: string;
};

type ClientLoginViewProps = {
  slug: string;
};

export function ClientLoginView({ slug }: ClientLoginViewProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !cpf.trim()) {
      setError("E-mail e CPF sao obrigatorios.");
      return;
    }

    if (mode === "register" && (!name.trim() || !phone.trim())) {
      setError("Nome e telefone sao obrigatorios no cadastro.");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = mode === "register" ? "/api/public/client/register" : "/api/public/client/login";
      const payload =
        mode === "register"
          ? { slug, name, email, phone, cpf }
          : { slug, email, cpf };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as AuthResponse;
      if (!response.ok || !data.success || !data.client) {
        setError(data.error || "Nao foi possivel autenticar.");
        return;
      }

      setSuccess(mode === "register" ? "Cadastro concluido com sucesso." : "Login realizado com sucesso.");
      router.replace(`/${slug}/profile`);
      router.refresh();
    } catch {
      setError("Erro de conexao. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4 py-10">
      <section className="w-full rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-xl backdrop-blur-sm md:p-8">
        <div className="mb-5 border-b border-white/10 pb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Acesso do participante</p>
          <h1 className="mt-2 text-2xl font-bold uppercase text-zinc-100">
            {mode === "register" ? "Criar conta na rifa" : "Entrar na sua conta"}
          </h1>
          <p className="mt-2 text-sm text-slate-300">Organizacao: /{slug || "..."}</p>
        </div>

        <div className="mb-4 inline-flex rounded-xl border border-white/10 bg-slate-950/40 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-lg px-3 py-1.5 text-sm ${mode === "login" ? "bg-cyan-600 text-white" : "text-slate-300"}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`rounded-lg px-3 py-1.5 text-sm ${mode === "register" ? "bg-cyan-600 text-white" : "text-slate-300"}`}
          >
            Cadastro
          </button>
        </div>

        <form className="grid gap-3" onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nome completo"
                className="rounded-xl border border-white/10 bg-slate-800/70 px-3 py-2 text-sm text-zinc-100"
              />
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Telefone"
                className="rounded-xl border border-white/10 bg-slate-800/70 px-3 py-2 text-sm text-zinc-100"
              />
            </>
          )}

          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="E-mail"
            className="rounded-xl border border-white/10 bg-slate-800/70 px-3 py-2 text-sm text-zinc-100"
          />
          <input
            value={cpf}
            onChange={(event) => setCpf(event.target.value)}
            placeholder="CPF"
            className="rounded-xl border border-white/10 bg-slate-800/70 px-3 py-2 text-sm text-zinc-100"
          />

          {error && <p className="text-sm text-red-400">{error}</p>}
          {success && <p className="text-sm text-emerald-400">{success}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-700 disabled:opacity-70"
          >
            {isSubmitting ? "Aguarde..." : mode === "register" ? "Criar conta" : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
