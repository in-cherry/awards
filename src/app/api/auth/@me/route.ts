import { getAuthUser } from "@/lib/auth/mddleware";
import prisma from "@/lib/database/prisma";
import { jsonError, jsonNoStore } from "@/lib/server/http";

function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `***.***.***-${digits.slice(-2)}`;
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `(**) *****-${digits.slice(-4)}`;
}

export async function GET() {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return jsonError("Nao autenticado", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        cpf: true,
        isActive: true,
        emailVerifiedAt: true,
        profile: {
          select: {
            nickname: true,
            avatar: true,
            banner: true,
            slug: true,
          },
        },
        ownedTenants: true,
        memberTenants: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!user) {
      return jsonError("Nao autenticado", 401);
    }

    return jsonNoStore({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phoneMasked: maskPhone(user.phone),
        cpfMasked: maskCpf(user.cpf),
        isActive: user.isActive,
        emailVerifiedAt: user.emailVerifiedAt,
        profile: user.profile,
      },
      tenants: [
        ...user.ownedTenants.map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          customDomain: t.customDomain,
          logo: t.logo,
          planName: t.planName,
          subscriptionStatus: t.subscriptionStatus,
          role: "OWNER",
        })),
        ...user.memberTenants.map((m) => ({
          id: m.tenant.id,
          name: m.tenant.name,
          slug: m.tenant.slug,
          customDomain: m.tenant.customDomain,
          logo: m.tenant.logo,
          planName: m.tenant.planName,
          subscriptionStatus: m.tenant.subscriptionStatus,
          role: m.role,
        })),
      ],
    });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return jsonError("Erro interno do servidor", 500);
  }
}