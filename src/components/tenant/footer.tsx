"use client";

import { InstagramLogoIcon } from "@radix-ui/react-icons";
import { motion } from "motion/react";
import Image from "next/image";
import { Logo } from "../ui/logo";

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-auto w-full border-t border-slate-500/10 px-4 py-6 text-sm md:px-8"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-xs text-zinc-300 md:text-sm">
            Copyright © 2026 - <a href="https://www.winzy.com.br" className="font-bold text-zinc-200" target="_blank" rel="noopener noreferrer">
              Winzy
            </a>
            . Todos os direitos reservados.
          </span>
        </div>

        <motion.a
          href="https://www.instagram.com/gowinzy/"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1 }}
          style={{ display: "inline-block" }}
        >
          <InstagramLogoIcon width={20} height={20} className="text-zinc-300 hover:text-zinc-200" />
        </motion.a>
      </div>
    </motion.footer>
  );
}