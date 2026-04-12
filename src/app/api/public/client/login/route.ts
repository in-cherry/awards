import { ZodError } from "zod";
import { NextRequest } from "next/server";
import prisma from "@/lib/database/prisma";
import { generateToken, getClientCookieName } from "@/lib/auth/jwt";
import { jsonError, jsonNoStore } from "@/lib/server/http";
import { checkRateLimit, getRequestIp } from "@/lib/server/rate-limit";
import { publicClientLoginSchema } from "@/lib/validation/auth";

export async function POST(request: NextRequest) {
  try {
    const { slug, email, cpf } = publicClientLoginSchema.parse(await request.json());
    const ip = getRequestIp(request);
    const rateLimit = checkRateLimit({
      key: `public:client:login:${ip}:${slug}:${email}`,
      limit: 8,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return jsonError("Muitas tentativas. Tente novamente em instantes.", 429, {
        retryAfter: rateLimit.retryAfterSeconds,
      });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
      },
    });

    if (!tenant) {
      return jsonError("Organizacao nao encontrada.", 404);
    }

    const client = await prisma.client.findFirst({
      where: {
        tenantId: tenant.id,
        email,
        cpf,
      },
      include: { profile: true },
    });

    if (!client) {
      return jsonError("Cliente nao encontrado para este email/CPF.", 404);
    }

    const token = await generateToken({
      userId: client.id,
      email: client.email,
      type: "client",
      tenantId: tenant.id,
    });

    const response = jsonNoStore({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        cpf: client.cpf,
        nickname: client.profile?.nickname ?? null,
        avatar: client.profile?.avatar ?? null,
      },
    });

    response.cookies.set({
      name: getClientCookieName(),
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Payload invalido.", 400, {
        issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      });
    }

    console.error("Erro no login de cliente:", error instanceof Error ? error.message : "erro desconhecido");
    return jsonError("Erro interno do servidor.", 500);
  }
}
