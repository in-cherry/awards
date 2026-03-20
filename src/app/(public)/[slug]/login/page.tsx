"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AuthResponse = {
  success: boolean;
  client?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    cpf: string;
    nickname?: string | null;
    avatar?: string | null;
  };
  error?: string;
import { redirect } from "next/navigation";
import { getClientAuthUser } from "@/lib/auth/mddleware";
import { prisma } from "@/lib/database/prisma";
import { ClientLoginView } from "./login-client";

type Params = Promise<{ slug: string }>;

export default async function ClientLoginPage(props: { params: Params }) {
  const { slug } = await props.params;
  const auth = await getClientAuthUser();

  if (auth) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.tenantId },
      select: { slug: true },
    });

    if (tenant?.slug === slug) {
      redirect(`/${slug}/profile`);
    }
  }

  return <ClientLoginView slug={slug} />;
}
setError("");
