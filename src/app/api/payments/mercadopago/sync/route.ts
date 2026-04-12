import { TenantRole } from "@prisma/client";
import { ZodError } from "zod";
import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/mddleware";
import { jsonError, jsonNoStore } from "@/lib/server/http";
import { getActiveTenantAccess, hasTenantRole } from "@/lib/server/tenant-access";
import { mercadopagoSyncSchema } from "@/lib/validation/mercadopago-sync";

function getInternalBaseUrl(): string | null {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!envUrl) return null;
  return envUrl.replace(/\/$/, "");
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return jsonError("Nao autenticado.", 401);

    const access = await getActiveTenantAccess(authUser.userId);
    if (!access) return jsonError("Organizacao ativa nao encontrada.", 404);

    if (!hasTenantRole(access, [TenantRole.OWNER, TenantRole.ADMIN])) {
      return jsonError("Sem permissao para sincronizar pagamentos.", 403);
    }

    const { externalId } = mercadopagoSyncSchema.parse(await request.json());
    const normalizedExternalId = String(externalId).trim();

    const baseUrl = getInternalBaseUrl();
    if (!baseUrl) {
      return jsonError("NEXT_PUBLIC_APP_URL nao configurada para sincronizacao manual.", 500);
    }

    const url = new URL(`/api/payments/mercadopago/webhook?id=${encodeURIComponent(normalizedExternalId)}`, baseUrl);
    const webhookResponse = await fetch(url, { method: "GET" });
    const data = await webhookResponse.json().catch(() => ({}));

    if (!webhookResponse.ok) {
      return jsonError(data?.error || "Falha ao sincronizar pagamento.", 500);
    }

    return jsonNoStore({ success: true, result: data?.result || null });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Payload invalido.", 400, {
        issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      });
    }

    console.error("Erro ao sincronizar pagamento manualmente:", error);
    return jsonError("Erro interno do servidor.", 500);
  }
}
