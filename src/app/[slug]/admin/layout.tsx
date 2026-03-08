import React from 'react';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  const tenant = await prisma.tenant.findUnique({ where: { slug } })
  const tenantName = tenant ? tenant.name : slug;
  const tenantFavicon = tenant?.faviconUrl || `/${slug}.ico`;

  return {
    title: `Winzy | ${tenantName} - Dashboard`,
    icons: {
      icon: tenantFavicon,
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