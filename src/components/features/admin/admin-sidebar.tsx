'use client';

import React from 'react';
import { Activity, Gift, LayoutDashboard, LogOut, Settings } from 'lucide-react';

type AdminTab = 'overview' | 'raffles' | 'settings';

interface AdminSidebarProps {
  tenantName: string;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
}

const tabs: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: 'overview', label: 'Visao Geral', icon: LayoutDashboard },
  { id: 'raffles', label: 'Rifas', icon: Gift },
  { id: 'settings', label: 'Configuracoes', icon: Settings },
];

export function AdminSidebar({ tenantName, activeTab, onTabChange, onLogout }: AdminSidebarProps) {
  return (
    <aside className="w-full lg:w-72 lg:sticky lg:top-4 lg:self-start">
      <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md p-3 lg:p-4">
        <div className="px-3 py-3 border-b border-white/10">
          <p className="text-[10px] uppercase tracking-widest font-black text-cyan-300">Dashboard Tenant</p>
          <h2 className="text-white font-black text-lg truncate">{tenantName}</h2>
        </div>

        <nav className="mt-3 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-gray-300 hover:text-white hover:bg-white/10 border border-transparent'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-emerald-300' : 'text-cyan-300'} />
                <span className="text-xs uppercase tracking-widest font-black">{tab.label}</span>
                {isActive ? <Activity size={14} className="ml-auto text-emerald-300" /> : null}
              </button>
            );
          })}
        </nav>

        <div className="mt-3 pt-3 border-t border-white/10">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs uppercase tracking-widest font-black text-gray-300 hover:text-white hover:bg-white/10 transition-all"
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
}