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
}

interface AdminPanelProps {
  tenant: { id: string; name: string; slug: string };
  stats: {
    totalTicketsSold: number;
    totalRevenue: number;
    totalBuyers: number;
  };
  raffles: RaffleStats[];
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ tenant, stats, raffles }) => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
      } else {
        setError(data.error || 'Usuário ou senha incorretos');
      }
    } catch (error) {
      setError('Erro ao fazer login. Tente novamente.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    router.push(`/${tenant.slug}`);
  };

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

