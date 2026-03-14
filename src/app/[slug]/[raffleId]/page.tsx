import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import React from 'react';

interface PageProps {
  params: Promise<{ slug: string; raffleId: string }>;
}

export default async function RaffleByIdPage({ params }: PageProps) {
  const { slug, raffleId } = await params;

  const raffle = await prisma.raffle.findFirst({
    where: {
      id: raffleId,
      tenant: { slug },
      status: 'ACTIVE',
    },
    select: { slug: true },
  });

  if (!raffle) {
    notFound();
  }

  redirect(`/${slug}/rifa/${raffle.slug}`);
}
