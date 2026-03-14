import React from 'react';
import { motion } from 'motion/react';
import { Lock, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 space-y-8 shadow-2xl">
          {/* Header */}
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
                <Shield className="text-emerald-400" size={32} />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                <Lock size={16} className="text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-black text-white tracking-tight">
                Painel de Controle
              </h1>
              <p className="text-sm text-gray-400 font-medium">
                Acesso restrito apenas para administradores
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <Input
                  label="Email"
                  type="email"
                  name="email"
                  placeholder="seu@email.com"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-3">
                <Input
                  label="Senha de Acesso"
                  type="password"
                  name="password"
                  placeholder="••••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                />
              </div>

              {adminError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center"
                >
                  <p className="text-red-400 text-sm font-bold">⚠️ {adminError}</p>
                </motion.div>
              )}
            </div>

            <div className="space-y-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button type="submit" className="w-full text-sm py-4">
                  <Shield size={16} />
                  Acessar Dashboard
                </Button>
              </motion.div>

              <button
                type="button"
                onClick={() => setIsAdmin(false)}
                className="w-full text-gray-400 hover:text-white transition-colors py-3 font-medium flex items-center justify-center gap-2 text-sm"
              >
                <ArrowLeft size={16} />
                Voltar ao Site Principal
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
