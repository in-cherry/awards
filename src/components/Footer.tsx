"use client";

import React from 'react';
import { motion } from 'motion/react';
import { Smartphone } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function Footer() {
  return (
    <motion.div variants={itemVariants} className="text-center py-4 mt-6">
      <p className="text-xs text-gray-500">
        &copy; 2026 Desenvolvido por <a href="https://winzy.com.br" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors font-bold">Winzy</a>. Todos os direitos reservados.
      </p>
    </motion.div>
  );
}