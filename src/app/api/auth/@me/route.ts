import { getAuthUser } from "@/lib/auth/mddleware";
import prisma from "@/lib/database/prisma";
import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

type UserWithTenantAccess = Prisma.UserGetPayload<{
  include: {
    profile: true;
    ownedTenants: true;
    memberTenants: {
      include: {
        tenant: true;
      };
    };
  };
}>;

export async function GET() {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = (await prisma.user.findUnique({
      where: { id: authUser.userId },
      include: {
        profile: true,
        ownedTenants: true,
        memberTenants: {
          include: { tenant: true },
        },
      },
    })) as UserWithTenantAccess | null;

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        cpf: user.cpf,
        profile: user.profile,
      },
      tenants: [
        ...user.ownedTenants.map((t) => ({ ...t, role: "OWNER" })),
        ...user.memberTenants.map((m) => ({
          ...m.tenant,
          role: m.role,
        })),
      ],
    });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}