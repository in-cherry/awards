import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { cookies } from "next/headers";
import prisma from "@/lib/database/prisma";
import { getAuthUser } from "@/lib/auth/mddleware";
import { getActiveTenantCookieName } from "@/lib/auth/jwt";

function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");

  return "http://localhost:3000";
}

function signState(payload: string): string {
  const secret = process.env.MP_OAUTH_STATE_SECRET || process.env.JWT_SECRET || "dev-mp-oauth-secret";
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export async function GET() {
  const baseUrl = getBaseUrl();

  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.redirect(new URL("/login", baseUrl));
  }

  const clientId = process.env.MP_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/dashboard/settings?mp=missing-client-id", baseUrl));
  }

  const cookieStore = await cookies();
  const activeTenantSlug = cookieStore.get(getActiveTenantCookieName())?.value;
  if (!activeTenantSlug) {
    return NextResponse.redirect(new URL("/dashboard/organizations?mp=missing-tenant", baseUrl));
  }

  const tenant = await prisma.tenant.findFirst({
    where: {
      slug: activeTenantSlug,
      OR: [
        { ownerId: authUser.userId },
        {
          members: {
            some: {
              userId: authUser.userId,
              revokedAt: null,
            },
          },
        },
      ],
    },
    select: { id: true },
  });

  if (!tenant) {
    return NextResponse.redirect(new URL("/dashboard/settings?mp=tenant-not-found", baseUrl));
  }

  const redirectUri = process.env.MP_REDIRECT_URI || `${baseUrl}/api/auth/mercadopago/callback`;
  const payload = Buffer.from(JSON.stringify({ tenantId: tenant.id, userId: authUser.userId })).toString("base64url");
  const state = `${payload}.${signState(payload)}`;

  const authUrl = new URL("https://auth.mercadopago.com/authorization");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("platform_id", "mp");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("redirect_uri", redirectUri);

  return NextResponse.redirect(authUrl);
}
