import React from 'react';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';

interface AdminLoginProps {
  adminUsername: string;
  setAdminUsername: (val: string) => void;
  adminPassword: string;
  setAdminPassword: (val: string) => void;
  adminError: string;
  handleAdminLogin: (e: React.FormEvent) => void;
  setIsAdmin: (val: boolean) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  adminUsername,
  setAdminUsername,
  adminPassword,
  setAdminPassword,
  adminError,
  handleAdminLogin,
  setIsAdmin
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-white/5 border border-white/10 rounded-[40px] p-10 space-y-8 backdrop-blur-xl"
      >
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-[32px] flex items-center justify-center mx-auto mb-6">
            <Lock className="text-emerald-400" size={40} />
          </div>
          <h1 className="text-2xl font-black font-display tracking-tight text-white">Acesso Restrito</h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Informe a senha administrativa</p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Email</label>
              <input
                type="email"
                placeholder="Digite o email"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-emerald-500/50 transition-all text-center text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Senha</label>
              <input
                type="password"
                placeholder="Digite a senha"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-emerald-500/50 transition-all text-center text-white"
              />
            </div>
            {adminError && <p className="text-red-400 text-[10px] font-bold text-center uppercase tracking-widest">{adminError}</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-5 rounded-2xl shadow-[0_20px_40px_rgba(16,185,129,0.3)] transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
          >
            Entrar no Painel
          </button>
          <button
            type="button"
            onClick={() => setIsAdmin(false)}
            className="w-full text-gray-500 text-[10px] font-black hover:text-white transition-colors uppercase tracking-widest"
          >
            Voltar para o site
          </button>
        </form>
      </motion.div>
    </div>
  );
};
