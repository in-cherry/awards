'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { useRouter } from 'next/navigation';

interface RaffleStats {
  id: string;
  title: string;
  status: string;
  totalNumbers: number;
  soldTickets: number;
  price: number;
  mysteryBoxEnabled: boolean;
  minNumbers: number;
  bannerUrl?: string | null;
  description?: string | null;
}

interface AdminPanelProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
    faviconUrl?: string;
    customDomain?: string | null;
    owner?: { id: string; name: string; avatarUrl?: string | null; };
  };
  stats: {
    totalTicketsSold: number;
    totalRevenue: number;
    totalFee: number;
    netRevenue: number;
    totalBuyers: number;
  };
  raffles: RaffleStats[];
  initialAuthenticated?: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ tenant, stats, raffles, initialAuthenticated = false }) => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuthenticated);
  const [checkingSession, setCheckingSession] = useState(!initialAuthenticated);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (initialAuthenticated) {
      return;
    }

    let active = true;

    void fetch(`/api/admin/session?tenantSlug=${encodeURIComponent(tenant.slug)}`)
      .then(async (response) => {
        if (!active) return;
        if (!response.ok) {
          setIsAuthenticated(false);
          return;
        }
        const data = await response.json();
        setIsAuthenticated(Boolean(data?.authenticated));
      })
      .catch(() => {
        if (!active) return;
        setIsAuthenticated(false);
      })
      .finally(() => {
        if (active) {
          setCheckingSession(false);
        }
      });

    return () => {
      active = false;
    };
  }, [initialAuthenticated, tenant.slug]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: username,
          password: password,
          tenantSlug: tenant.slug
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        setError('');
        window.location.href = `/${tenant.slug}/admin`;
      } else {
        setError(data.error || 'Usuário ou senha incorretos');
      }
    } catch (error) {
      setError('Erro ao fazer login. Tente novamente.');
    }
  };

  const handleLogout = () => {
    void fetch('/api/admin/logout', { method: 'POST' }).finally(() => {
      setIsAuthenticated(false);
      setUsername('');
      setPassword('');
      router.push(`/${tenant.slug}`);
    });
  };

  if (checkingSession) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-[#0f172a] flex items-center justify-center"
      >
        <p className="text-white/70 text-sm uppercase tracking-widest font-black">Carregando sessao...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#0f172a]"
    >
      {!isAuthenticated ? (
        <AdminLogin
          adminUsername={username}
          setAdminUsername={setUsername}
          adminPassword={password}
          setAdminPassword={setPassword}
          adminError={error}
          handleAdminLogin={handleLogin}
          setIsAdmin={() => router.push(`/${tenant.slug}`)}
        />
      ) : (
        <AdminDashboard
          tenant={tenant}
          stats={stats}
          raffles={raffles}
          onLogout={handleLogout}
        />
      )}
    </motion.div>
  );
};

