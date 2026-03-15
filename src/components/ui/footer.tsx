"use client";

import { InstagramLogoIcon } from "@radix-ui/react-icons";
import { motion } from "motion/react";
import Image from "next/image";

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full flex items-center justify-between p-16 text-sm"
    >
      <div className="flex items-center gap-2">
        <Image
          src="/winzy_logo.png"
          alt="Winzy Logo"
          width={48}
          height={48}
        />
        <span className="text-stone-100">
          Copyright © 2026 - <span className="font-bold">Winzy</span>. Todos os direitos reservados.
        </span>
      </div>

      <a
        href="https://www.instagram.com/gowinzy/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <InstagramLogoIcon width={24} height={24} className="text-zinc-100" />
      </a>
    </motion.footer>
  );
}