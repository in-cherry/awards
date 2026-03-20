"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

type TenantOption = {
  slug: string;
  name: string;
};

type TenantSwitcherProps = {
  activeTenantName: string;
  tenants: TenantOption[];
};

export function TenantSwitcher({ activeTenantName, tenants }: TenantSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const hasTenants = tenants.length > 0;
  const sortedTenants = useMemo(
    () => [...tenants].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [tenants],
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex max-w-[58vw] items-center gap-2 truncate rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300 transition-colors hover:bg-blue-500/20 md:max-w-[38vw]"
      >
        <span className="truncate">{activeTenantName}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 z-[95] mt-2 w-72 overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl">
          {!hasTenants ? (
            <div className="px-4 py-3 text-sm text-slate-300">Nenhuma organização disponível.</div>
          ) : (
            <div className="max-h-80 overflow-y-auto p-1">
              {sortedTenants.map((tenant) => (
                <button
                  key={tenant.slug}
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.replace(`/dashboard/select/${tenant.slug}?next=/dashboard`);
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-white/5"
                >
                  {tenant.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}