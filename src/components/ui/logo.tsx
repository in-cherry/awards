"use client";

import Image from "next/image";
import { motion } from "motion/react";

type LogoLinkProps = {
  href?: string;
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
};

export function Logo({
  href = "https://winzy.com.br",
  src = "/winzy_logo.png",
  alt = "Winzy Logo",
  width = 48,
  height = 48,
  className,
}: LogoLinkProps) {
  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.1 }}
      style={{ display: "inline-block" }}
      className={className}
    >
      <Image src={src} alt={alt} width={width} height={height} />
    </motion.a>
  );
}