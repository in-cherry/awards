"use client";

import { motion } from "motion/react";
import { useApp } from "@/contexts";

export function NoRaffle() {
  const { tenant } = useApp();

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900/50 p-6 text-center shadow-xl backdrop-blur-sm md:p-8"
    >
      <h1 className="mt-2 text-2xl font-bold uppercase text-zinc-100">Nenhuma rifa ativa no momento</h1>
      <p className="mt-2 text-sm text-slate-300">Volte em breve para acompanhar as proximas campanhas.</p>
    </motion.section>
  );
}
