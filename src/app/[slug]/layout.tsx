import React from 'react';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      name: true,
      faviconUrl: true,
      metaTitle: true,
      metaDescription: true,
    },
  });
  const tenantName = tenant ? tenant.name : slug;
  const tenantFavicon = tenant?.faviconUrl || `/icon.svg`;
  const platformTitle = 'Winzy';
  const platformDescription = 'Uma plataforma para gerenciar, criar e premiar conquistas em eventos, empresas ou comunidades.';
  const customTitle = typeof tenant?.metaTitle === 'string' ? tenant.metaTitle.trim() : '';
  const customDescription = typeof tenant?.metaDescription === 'string' ? tenant.metaDescription.trim() : '';
  const title = customTitle || `${platformTitle} | ${tenantName}`;
  const description = customDescription || platformDescription;

  return {
    title,
    description,
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