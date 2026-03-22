import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/database/prisma";
import { getAuthUser } from "@/lib/auth/mddleware";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function normalizeSlug(rawSlug: string): string {
  return slugify(rawSlug);
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json({ success: false, error: "Não autenticado." }, { status: 401 });
    }

    // Verificar se o usuário tem pelo menos uma organização com assinatura ATIVA
    const activeSubscription = await prisma.tenant.findFirst({
      where: {
        ownerId: authUser.userId,
        subscription: {
          status: "ACTIVE"
        }
      },
      select: { id: true }
    });

    if (!activeSubscription) {
      return NextResponse.json(
        {
          success: false,
          error: "Você precisa ter uma assinatura ativa para criar uma nova organização. Escolha um plano e aguarde a ativação pelo administrador."
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    const requestedSlug = String(body?.slug ?? "").trim();

    if (!name) {
      return NextResponse.json({ success: false, error: "Informe o nome da organização." }, { status: 400 });
    }

    if (name.length < 3) {
      return NextResponse.json({ success: false, error: "O nome deve ter pelo menos 3 caracteres." }, { status: 400 });
    }

    const baseSlug = normalizeSlug(requestedSlug || name);

    if (!baseSlug) {
      return NextResponse.json({ success: false, error: "Slug inválido." }, { status: 400 });
    }

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const exists = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
      if (!exists) break;
      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }

    const tenant = await prisma.tenant.create({
      data: {
        ownerId: authUser.userId,
        name,
        slug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, tenant }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar tenant:", error);
    return NextResponse.json({ success: false, error: "Erro interno do servidor." }, { status: 500 });
  }
}