"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";

interface LoginProcessingDialogProps {
  isOpen: boolean;
}

export function LoginProcessingDialog({ isOpen }: LoginProcessingDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog.Root open={isOpen}>
          <Dialog.Portal>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              />
            </Dialog.Overlay>

            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 outline-none" asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="w-80 rounded-2xl border border-white/10 bg-slate-900/95 p-8 shadow-2xl backdrop-blur-sm"
              >
                <div className="flex flex-col items-center gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="h-8 w-8 text-cyan-500" />
                  </motion.div>

                  <div className="text-center">
                    <Dialog.Title className="text-lg font-semibold text-zinc-100">
                      Verificando dados
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-slate-400">
                      Aguarde enquanto processamos sua requisição...
                    </p>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </AnimatePresence>
  );
}
