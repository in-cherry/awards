"use client";

import React from 'react';
import { Search } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'next/navigation';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function SearchBar() {
  const {
    user,
    tenant,
    setIsLoginModalOpen,
    setLoginCpf,
    setLoginCpfError,
    setLoginEmail,
    setLoginEmailError,
    setIsLoginStepEmail,
    setLoginUser
  } = useApp();
  const router = useRouter();

  const handleOpenLogin = () => {
    // Sessao de cliente agora e validada no servidor via cookie httpOnly.
    if (user?.cpf) {
      router.push(`/${tenant?.slug}/meus-bilhetes`);
      return;
    }
    setIsLoginModalOpen(true);
    setLoginCpf('');
    setLoginCpfError('');
    setLoginEmail('');
    setLoginEmailError('');
    setIsLoginStepEmail(false);
    setLoginUser(null);
  };

  return (
    <motion.div variants={itemVariants} className="relative group">
      <button
        onClick={handleOpenLogin}
        className="flex items-center justify-center w-full gap-3 px-4 py-4 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-md text-gray-400 hover:text-white hover:bg-white/10 hover:border-emerald-500/30 transition-all text-center font-bold text-sm tracking-[0.2em] outline-none group cursor-pointer"
      >
        <Search size={20} />
        <span>VER MEUS BILHETES</span>
      </button>
    </motion.div>
  );
}