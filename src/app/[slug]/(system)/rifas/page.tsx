import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import React from 'react';
import { AppContextProvider } from '@/contexts/AppContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import Image from 'next/image';
import Link from 'next/link';
import { Gift } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function RifasPage({ params }: PageProps) {
  const { slug } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      owner: {
        select: {
          name: true,
          avatarUrl: true
        }
      },
      raffles: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!tenant) {
    notFound();
  }

  const tenantData = {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    logoUrl: tenant.logoUrl,
    isActive: tenant.isActive,
    owner: {
      name: tenant.owner?.name || '',
      avatarUrl: tenant.owner?.avatarUrl || null,
    }
  };

  return (
    <AppContextProvider tenant={tenantData}>
      <div className="min-h-screen flex flex-col bg-[#050505]">
        <Header />

        <main className="flex-grow pt-24 pb-20 px-4 md:px-0 max-w-lg mx-auto w-full">
          <div className="mb-8 text-center space-y-4">
            <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">
              Rifas <span className="text-emerald-500">Ativas</span>
            </h1>
            <p className="text-gray-400 font-medium">
              Escolha uma rifa abaixo e participe!
            </p>
          </div>

          <div className="space-y-4">
            {tenant.raffles.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <Gift className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-white font-bold mb-2">Nenhuma rifa ativa</h3>
                <p className="text-gray-400 text-sm">No momento não temos rifas em andamento.</p>
              </div>
            ) : (
              tenant.raffles.map((raffle) => (
                <Link
                  key={raffle.id}
                  href={`/${slug}/${raffle.id}`}
                  className="block group"
                >
                  <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-colors">
                    <div className="aspect-[21/9] relative bg-neutral-900">
                      {raffle.bannerUrl ? (
                        <Image
                          src={raffle.bannerUrl}
                          alt={raffle.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                          <Gift size={32} />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex-1 pr-4 whitespace-nowrap overflow-hidden">
                        <h3 className="text-white font-black uppercase text-lg truncate">
                          {raffle.title}
                        </h3>
                        <p className="text-emerald-400 font-bold text-sm">
                          R$ {Number(raffle.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] px-4 py-2 rounded-xl shrink-0">
                        Ver Mais
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </main>

        <Footer />
      </div>
    </AppContextProvider>
  );
}
