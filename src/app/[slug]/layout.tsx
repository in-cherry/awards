import React from 'react';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  const tenant = await prisma.tenant.findUnique({ where: { slug } })
  const tenantName = tenant ? tenant.name : slug;

  return {
    title: `Winzy | ${tenantName}`,
    icons: {
      icon: `/${slug}.ico`,
    },
  };
}

export default function RaffleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
    </div>
  );
}