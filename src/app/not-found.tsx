import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-8xl font-black text-emerald-400">404</div>
        <h1 className="text-3xl font-black tracking-tight">Página não encontrada</h1>
        <p className="text-gray-400 text-sm">
          A página que você está procurando não existe ou foi removida.
        </p>
        <Link
          href="/"
          className="inline-block bg-emerald-500 hover:bg-emerald-400 text-white font-black px-8 py-3 rounded-2xl uppercase tracking-widest text-xs transition-all active:scale-95"
        >
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}
