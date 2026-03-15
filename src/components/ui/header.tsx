"use client";

import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import Link from "next/link";
import { MoreVertical, Ticket } from "lucide-react";
import Image from "next/image";

export function Header() {
  const user = "Guest";
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }
      }
      animate={{ opacity: 1, y: 0 }}

      className="top-0 z-40 p-4"
    >
      <div className="mx-auto flex w-full max-w-2xl justify-between rounded-full border border-white/5 bg-[#0f172a]/90 px-4 py-3 shadow-lg backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/incherry_logo.svg"
            alt="InCherry Logo"
            width={32}
            height={32}
          />
        </Link>

        {/* <h1 className="text-2xl font-bold text-white">InCherry</h1> */}

        <div className="flex items-center gap-2">
          <Link href="/" className="text-sm text-gray-300 hover:text-white">
            <Ticket size={16} />
          </Link>

          <button className="flex items-center justify-center text-stone-400">
            <MoreVertical size={12} />
          </button>

          <Avatar>
            <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${user}`} />
            <AvatarFallback>{user.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </motion.header >

  );
} 