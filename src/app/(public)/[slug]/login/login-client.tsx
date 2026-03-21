"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { TenantLogoHeader } from "@/components/tenant/tenant-logo-header";
import { LoginProcessingDialog } from "@/components/tenant/login-processing-dialog";

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
  tenant?: {
    name?: string;
    logoUrl?: string | null;
  };
};

export function ClientLoginView({ slug, tenant }: ClientLoginViewProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProcessingDialog, setShowProcessingDialog] = useState(false);
  const [processingTimer, setProcessingTimer] = useState<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (processingTimer) clearTimeout(processingTimer);
    };
  }, [processingTimer]);

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
    setShowProcessingDialog(true);

    const timer = setTimeout(async () => {
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
          setShowProcessingDialog(false);
          return;
        }

        setSuccess(mode === "register" ? "Cadastro concluido com sucesso." : "Login realizado com sucesso.");
        router.replace(`/${slug}/profile`);
        router.refresh();
      } catch {
        setError("Erro de conexao. Tente novamente.");
        setShowProcessingDialog(false);
      } finally {
        setIsSubmitting(false);
      }
    }, 1000);

    setProcessingTimer(timer);
  }

  return (
    <>
      <LoginProcessingDialog isOpen={showProcessingDialog} />
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4 py-10">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-xl backdrop-blur-sm md:p-8"
        >
          <TenantLogoHeader
            href={`/${slug}`}
            logoUrl={tenant?.logoUrl}
            tenantName={tenant?.name}
          />

          <div className="mb-5 border-b border-white/10 pb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Acesso do participante</p>
            <h1 className="mt-2 text-2xl font-bold uppercase text-zinc-100">
              {mode === "register" ? "Criar conta na rifa" : "Entrar na sua conta"}
            </h1>
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

          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="grid gap-3"
            onSubmit={handleSubmit}
          >
            {mode === "register" && (
              <>
                <motion.input
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Nome completo"
                  className="rounded-xl border border-white/10 bg-slate-800/70 px-3 py-2 text-sm text-zinc-100"
                />
                <motion.input
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Telefone"
                  className="rounded-xl border border-white/10 bg-slate-800/70 px-3 py-2 text-sm text-zinc-100"
                />
              </>
            )}

            <motion.input
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: mode === "register" ? 0.35 : 0.25 }}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="E-mail"
              className="rounded-xl border border-white/10 bg-slate-800/70 px-3 py-2 text-sm text-zinc-100"
            />
            <motion.input
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: mode === "register" ? 0.4 : 0.3 }}
              value={cpf}
              onChange={(event) => setCpf(event.target.value)}
              placeholder="CPF"
              className="rounded-xl border border-white/10 bg-slate-800/70 px-3 py-2 text-sm text-zinc-100"
            />

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-red-400"
              >
                {error}
              </motion.p>
            )}
            {success && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-emerald-400"
              >
                {success}
              </motion.p>
            )}

            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: mode === "register" ? 0.45 : 0.35 }}
              type="submit"
              disabled={isSubmitting}
              className="mt-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-700 disabled:opacity-70"
            >
              {isSubmitting ? "Aguarde..." : mode === "register" ? "Criar conta" : "Entrar"}
            </motion.button>
          </motion.form>
        </motion.section>
      </main>
    </>
  );
}
