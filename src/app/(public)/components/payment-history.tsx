"use client";

import { CheckCircle, Clock, XCircle, MoreVertical } from "lucide-react";

interface PaymentHistory {
  id: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELED";
  totalValue: number;
  method: string;
  raffleId?: string;
  raffleName?: string;
  ticketCount: number;
  createdAt: string;
}

export function PaymentHistory({ payments = [] }: { payments?: PaymentHistory[] }) {
  if (!payments || payments.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-slate-900/30 p-8 text-center">
        <p className="text-sm text-slate-400">Nenhum pagamento realizado ainda</p>
      </div>
    );
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "COMPLETED":
        return (
          <div className="flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-1">
            <CheckCircle size={14} className="text-emerald-400" />
            <span className="text-xs font-medium text-emerald-200">Confirmado</span>
          </div>
        );
      case "PENDING":
        return (
          <div className="flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-1">
            <Clock size={14} className="text-amber-400" />
            <span className="text-xs font-medium text-amber-200">Pendente</span>
          </div>
        );
      case "FAILED":
      case "CANCELED":
        return (
          <div className="flex items-center gap-1 rounded-full bg-red-500/20 border border-red-500/40 px-2 py-1">
            <XCircle size={14} className="text-red-400" />
            <span className="text-xs font-medium text-red-200">Falhou</span>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/30 p-4 transition-colors hover:border-white/20 hover:bg-slate-900/50"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div>
                <p className="text-sm font-medium text-white">
                  {payment.raffleName || "Compra de Bilhetes"}
                </p>
                <p className="text-xs text-slate-400">
                  {payment.ticketCount} bilhete{payment.ticketCount > 1 ? "s" : ""} • {payment.method}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              {new Date(payment.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div className="flex items-center gap-3 ml-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-white">
                R$ {payment.totalValue.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            {getStatusBadge(payment.status)}
          </div>
        </div>
      ))}
    </div>
  );
}
