import { ZodError } from "zod";
import { NextRequest } from "next/server";
import prisma from "@/lib/database/prisma";
import { generateToken, getClientCookieName } from "@/lib/auth/jwt";
import { jsonError, jsonNoStore } from "@/lib/server/http";
import { checkRateLimit, getRequestIp } from "@/lib/server/rate-limit";
import { publicClientRegisterSchema } from "@/lib/validation/auth";

export async function POST(request: NextRequest) {
  try {
    const { slug, name, email, phone, cpf } = publicClientRegisterSchema.parse(await request.json());
    const ip = getRequestIp(request);
    const rateLimit = checkRateLimit({
      key: `public:client:register:${ip}:${slug}:${email}`,
      limit: 5,
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
        slug: true,
        name: true,
      },
    });

    if (!tenant) {
      return jsonError("Organizacao nao encontrada.", 404);
    }

    const existingByEmail = await prisma.client.findFirst({
      where: {
        tenantId: tenant.id,
        email,
      },
      select: { id: true, cpf: true },
    });

    const existingByCpf = await prisma.client.findFirst({
      where: {
        tenantId: tenant.id,
        cpf,
      },
      select: { id: true, email: true },
    });

    if (existingByEmail && existingByEmail.cpf !== cpf) {
      return jsonError("Este email ja esta vinculado a outro CPF.", 409);
    }

    if (existingByCpf && existingByCpf.email !== email) {
      return jsonError("Este CPF ja esta vinculado a outro email.", 409);
    }

    const client = existingByEmail || existingByCpf
      ? await prisma.client.update({
        where: { id: (existingByEmail?.id || existingByCpf?.id)! },
        data: {
          name,
          email,
          phone,
          cpf,
        },
        include: { profile: true },
      })
      : await prisma.client.create({
        data: {
          tenantId: tenant.id,
          name,
          email,
          phone,
          cpf,
        },
        include: { profile: true },
      });

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

    console.error("Erro no registro de cliente:", error instanceof Error ? error.message : "erro desconhecido");
    return jsonError("Erro interno do servidor.", 500);
  }
}
