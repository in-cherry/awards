import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b1220] px-4 py-10">
      <main className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900/55 p-8 text-center shadow-2xl backdrop-blur-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Erro 404</p>
        <h1 className="mt-3 text-4xl font-bold uppercase text-zinc-100 md:text-5xl">Pagina nao encontrada</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-slate-300 md:text-base">
          A rota que voce tentou acessar nao existe ou foi movida.
        </p>

        <div className="mt-7 flex justify-center">
          <Link
            href="/"
            className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-700"
          >
            Voltar para a pagina inicial
          </Link>
        </div>
      </main>
    </div>
  );
}