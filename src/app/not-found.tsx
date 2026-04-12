import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-clip bg-[#0B0B0F] px-6 text-slate-100">
      {/* Animated gradient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-[#2563EB]/15 blur-3xl opacity-50" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#7C3AED]/15 blur-3xl opacity-50" />
        <div className="absolute inset-0 bg-[#0B0B0F]" />
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="text-center mb-12">
          {/* 404 Code */}
          <div className="liquid-glass mb-8 inline-flex h-20 w-20 items-center justify-center rounded-2xl">
            <span className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] bg-clip-text text-5xl font-bold text-transparent">
              404
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl font-medium mb-4 leading-tight">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Página não encontrada
            </span>
          </h1>

          {/* Description */}
          <p className="text-base md:text-lg text-slate-400 max-w-md mx-auto mb-8">
            A rota que você tentou acessar não existe ou foi movida. Volte à página inicial e continue explorando.
          </p>

          {/* Code snippet */}
          <div className="liquid-glass-strong mb-10 inline-block w-full overflow-hidden rounded-2xl text-left">
            <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/30" />
              <span className="text-xs font-mono text-slate-400">error.ts</span>
            </div>
            <pre className="p-6 overflow-x-auto">
              <code className="font-mono text-sm text-slate-300">
                {`try {
  await navigateTo('/');
} catch (error) {
  console.error('Route not found');
  // This page doesn't exist
}`}
              </code>
            </pre>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] px-8 py-3 font-medium text-white transition hover:brightness-110"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para a página inicial
            </Link>
            <Link
              href="#"
              className="liquid-glass inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3 font-medium text-slate-300 transition hover:text-white"
            >
              Falar com especialista
            </Link>
          </div>
        </div>

        {/* Footer hint */}
        <div className="mt-16 pt-8 border-t border-white/10 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider">
            © 2026 Winzy • Engenharia e estratégia para presença digital
          </p>
        </div>
      </div>
    </div>
  );
}