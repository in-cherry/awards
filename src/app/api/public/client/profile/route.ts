import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/database/prisma";
import { getClientAuthUser } from "@/lib/auth/mddleware";

export async function PATCH(request: NextRequest) {
  try {
    const authClient = await getClientAuthUser();
    if (!authClient || !authClient.tenantId) {
      return NextResponse.json({ success: false, error: "Nao autenticado." }, { status: 401 });
    }

    const body = await request.json();
    const slug = String(body?.slug || "").trim().toLowerCase();
    const name = String(body?.name || "").trim();
    const nickname = body?.nickname ? String(body.nickname).trim() : null;
    const avatar = body?.avatar ? String(body.avatar).trim() : null;
    const banner = body?.banner ? String(body.banner).trim() : null;

    if (!slug) {
      return NextResponse.json({ success: false, error: "Slug obrigatorio." }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ success: false, error: "Nome e obrigatorio." }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!tenant || tenant.id !== authClient.tenantId) {
      return NextResponse.json({ success: false, error: "Sessao invalida para esta organizacao." }, { status: 403 });
    }

    const client = await prisma.client.findFirst({
      where: {
        id: authClient.userId,
        tenantId: tenant.id,
      },
      select: { id: true, profile: { select: { id: true } } },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: "Cliente nao encontrado." }, { status: 404 });
    }

    await prisma.client.update({
      where: { id: client.id },
      data: { name },
    });

    await prisma.clientProfile.upsert({
      where: {
        clientId: client.id,
      },
      create: {
        clientId: client.id,
        nickname,
        avatar,
        banner,
      },
      update: {
        nickname,
        avatar,
        banner,
      },
    });

    const updated = await prisma.client.findUnique({
      where: { id: client.id },
      include: { profile: true },
    });

    return NextResponse.json({
      success: true,
      client: {
        id: updated?.id,
        name: updated?.name,
        email: updated?.email,
        phone: updated?.phone,
        cpf: updated?.cpf,
        profile: {
          nickname: updated?.profile?.nickname ?? null,
          avatar: updated?.profile?.avatar ?? null,
          banner: updated?.profile?.banner ?? null,
        },
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil do cliente:", error);
    return NextResponse.json({ success: false, error: "Erro interno do servidor." }, { status: 500 });
  }
}
