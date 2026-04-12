import { TenantRole } from "@prisma/client";
import { ZodError } from "zod";
import { NextRequest } from "next/server";
import prisma from "@/lib/database/prisma";
import { getAuthUser } from "@/lib/auth/mddleware";
import { jsonError, jsonNoStore } from "@/lib/server/http";
import { getActiveTenantAccess, hasTenantRole } from "@/lib/server/tenant-access";
import { dashboardSettingsSchema } from "@/lib/validation/dashboard-settings";

function normalizeOptionalField(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const normalized = value.trim();
  return normalized.length ? normalized : null;
}

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) return jsonError("Nao autenticado.", 401);

  const access = await getActiveTenantAccess(authUser.userId);
  if (!access) return jsonError("Organizacao ativa nao encontrada.", 404);

  const tenant = await prisma.tenant.findUnique({
    where: { id: access.id },
    include: {
      connections: {
        where: {
          provider: "MERCADO_PAGO",
          status: "ACTIVE",
        },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!tenant) return jsonError("Organizacao ativa nao encontrada.", 404);

  return jsonNoStore({
    success: true,
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      customDomain: tenant.customDomain,
      metaTitle: tenant.metaTitle,
      metaDescription: tenant.metaDescription,
      favicon: tenant.favicon,
      logo: tenant.logo,
      instagram: tenant.instagram,
      telegram: tenant.telegram,
      supportUrl: tenant.supportUrl,
      planName: tenant.planName,
      planPriceMonthly: tenant.planPriceMonthly,
      billingDay: tenant.billingDay,
      nextBillingAt: tenant.nextBillingAt,
      subscriptionStatus: tenant.subscriptionStatus,
      mercadoPago: {
        connected: tenant.connections.length > 0,
        accountId: tenant.connections[0]?.providerAccountId ?? null,
        publicEmail: tenant.connections[0]?.publicEmail ?? null,
      },
    },
  });
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return jsonError("Nao autenticado.", 401);

    const access = await getActiveTenantAccess(authUser.userId);
    if (!access) return jsonError("Organizacao ativa nao encontrada.", 404);

    if (!hasTenantRole(access, [TenantRole.OWNER, TenantRole.ADMIN])) {
      return jsonError("Sem permissao para editar configuracoes.", 403);
    }

    const payload = dashboardSettingsSchema.parse(await request.json());
    const customDomain = normalizeOptionalField(payload.customDomain);

    if (customDomain && /(^https?:\/\/)|\//i.test(customDomain)) {
      return jsonError("Informe apenas o host de dominio, sem protocolo ou barras.", 400);
    }

    if (customDomain && customDomain === access.slug) {
      return jsonError("Dominio customizado invalido.", 400);
    }

    if (customDomain) {
      const domainOwner = await prisma.tenant.findFirst({
        where: {
          customDomain,
          id: { not: access.id },
        },
        select: { id: true },
      });

      if (domainOwner) {
        return jsonError("Esse dominio ja esta em uso por outra organizacao.", 409);
      }
    }

    const currentTenant = await prisma.tenant.findUnique({
      where: { id: access.id },
      select: { name: true },
    });

    if (!currentTenant) return jsonError("Organizacao ativa nao encontrada.", 404);

    const updated = await prisma.tenant.update({
      where: { id: access.id },
      data: {
        name: normalizeOptionalField(payload.name) ?? currentTenant.name,
        customDomain,
        metaTitle: normalizeOptionalField(payload.metaTitle),
        metaDescription: normalizeOptionalField(payload.metaDescription),
        favicon: normalizeOptionalField(payload.favicon),
        logo: normalizeOptionalField(payload.logo),
        instagram: normalizeOptionalField(payload.instagram),
        telegram: normalizeOptionalField(payload.telegram),
        supportUrl: normalizeOptionalField(payload.supportUrl),
      },
    });

    return jsonNoStore({
      success: true,
      tenant: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        customDomain: updated.customDomain,
        metaTitle: updated.metaTitle,
        metaDescription: updated.metaDescription,
        favicon: updated.favicon,
        logo: updated.logo,
        instagram: updated.instagram,
        telegram: updated.telegram,
        supportUrl: updated.supportUrl,
        planName: updated.planName,
        planPriceMonthly: updated.planPriceMonthly,
        billingDay: updated.billingDay,
        nextBillingAt: updated.nextBillingAt,
        subscriptionStatus: updated.subscriptionStatus,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Payload invalido.", 400, {
        issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      });
    }

    console.error("Erro ao atualizar configuracoes:", error);
    return jsonError("Erro interno do servidor.", 500);
  }
}
