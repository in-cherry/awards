import { TenantRole } from "@prisma/client";
import { ZodError } from "zod";
import { NextRequest } from "next/server";
import prisma from "@/lib/database/prisma";
import { getAuthUser } from "@/lib/auth/mddleware";
import { jsonError, jsonNoStore } from "@/lib/server/http";
import { getActiveTenantAccess, hasTenantRole } from "@/lib/server/tenant-access";
import { dashboardRaffleSchema } from "@/lib/validation/dashboard-raffles";

const MYSTERY_PRIZE_TYPE_MONETARY = "[[TYPE:MONETARY]]";
const MYSTERY_PRIZE_TYPE_PHYSICAL = "[[TYPE:PHYSICAL]]";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) return jsonError("Nao autenticado.", 401);

  const access = await getActiveTenantAccess(authUser.userId);
  if (!access) return jsonError("Organizacao ativa nao encontrada.", 404);

  const connectionCount = await prisma.connection.count({
    where: {
      tenantId: access.id,
      provider: "MERCADO_PAGO",
      status: "ACTIVE",
    },
  });

  const raffles = await prisma.raffle.findMany({
    where: {
      tenantId: access.id,
      status: "ACTIVE",
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      banner: true,
      pixValue: true,
      priceTicket: true,
      minTickets: true,
      maxTickets: true,
      collaboratorPrizesEnabled: true,
      collaboratorPrizeFirst: true,
      collaboratorPrizeSecond: true,
      collaboratorPrizeThird: true,
      mysteryPrizes: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          value: true,
          chance: true,
          remaining: true,
          totalAmount: true,
        },
      },
      status: true,
      createdAt: true,
    },
  });

  const raffleIds = raffles.map((raffle) => raffle.id);

  const [soldTicketsByRaffle, winnerAwards] = await Promise.all([
    raffleIds.length
      ? prisma.ticket.groupBy({
        by: ["raffleId"],
        where: {
          raffleId: { in: raffleIds },
          payment: {
            status: "COMPLETED",
          },
        },
        _count: {
          _all: true,
        },
      })
      : Promise.resolve([]),
    raffleIds.length
      ? prisma.award.findMany({
        where: {
          raffleId: { in: raffleIds },
          type: "RAFFLE_WINNER",
        },
        select: {
          id: true,
          raffleId: true,
          createdAt: true,
        },
      })
      : Promise.resolve([]),
  ]);

  const soldTicketsMap = new Map(soldTicketsByRaffle.map((row) => [row.raffleId, row._count._all]));
  const winnerMap = new Map(
    winnerAwards.map((award) => [award.raffleId, { id: award.id, createdAt: award.createdAt.toISOString() }]),
  );

  return jsonNoStore({
    success: true,
    mercadoPagoConnected: connectionCount > 0,
    tenant: {
      name: access.name,
      slug: access.slug,
    },
    raffles: raffles.map((raffle) => ({
      ...raffle,
      pixValue: Number(raffle.pixValue),
      priceTicket: Number(raffle.priceTicket),
      collaboratorPrizeFirst: raffle.collaboratorPrizeFirst ? Number(raffle.collaboratorPrizeFirst) : null,
      collaboratorPrizeSecond: raffle.collaboratorPrizeSecond ? Number(raffle.collaboratorPrizeSecond) : null,
      collaboratorPrizeThird: raffle.collaboratorPrizeThird ? Number(raffle.collaboratorPrizeThird) : null,
      soldTicketsCount: soldTicketsMap.get(raffle.id) || 0,
      soldTicketsTotal: raffle.maxTickets,
      winner: winnerMap.get(raffle.id) || null,
      mysteryPrizes: raffle.mysteryPrizes.map((prize) => ({
        id: prize.id,
        name: prize.name,
        value: Number(prize.value),
        chance: Number(prize.chance),
        remaining: prize.remaining,
        totalAmount: prize.totalAmount,
      })),
    })),
  });
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return jsonError("Nao autenticado.", 401);

    const access = await getActiveTenantAccess(authUser.userId);
    if (!access) return jsonError("Organizacao ativa nao encontrada.", 404);

    if (!hasTenantRole(access, [TenantRole.OWNER, TenantRole.ADMIN])) {
      return jsonError("Sem permissao para criar rifa.", 403);
    }

    const hasActiveConnection =
      (await prisma.connection.count({
        where: {
          tenantId: access.id,
          provider: "MERCADO_PAGO",
          status: "ACTIVE",
        },
      })) > 0;

    if (!hasActiveConnection) {
      return jsonError("Conecte o Mercado Pago da organizacao antes de criar uma rifa.", 403);
    }

    const payload = dashboardRaffleSchema.parse(await request.json());

    if (payload.maxTickets < payload.minTickets) {
      return jsonError("Faixa de tickets invalida.", 400);
    }

    if (payload.collaboratorPrizesEnabled) {
      const prizes = [payload.collaboratorPrizeFirst, payload.collaboratorPrizeSecond, payload.collaboratorPrizeThird]
        .filter((value) => value !== null) as number[];
      if (prizes.some((value) => !Number.isFinite(value) || value <= 0)) {
        return jsonError("Premios de colaboradores invalidos.", 400);
      }
    }

    const baseSlug = slugify(payload.slug ? payload.slug : payload.name);
    if (!baseSlug) return jsonError("Slug invalido.", 400);

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const exists = await prisma.raffle.findUnique({
        where: { tenantId_slug: { tenantId: access.id, slug } },
        select: { id: true },
      });
      if (!exists) break;
      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }

    const raffle = await prisma.raffle.create({
      data: {
        tenantId: access.id,
        name: payload.name,
        slug,
        description: payload.description,
        banner: payload.banner,
        pixValue: payload.pixValue,
        priceTicket: payload.priceTicket,
        minTickets: payload.minTickets,
        maxTickets: payload.maxTickets,
        status: "ACTIVE",
        collaboratorPrizesEnabled: payload.collaboratorPrizesEnabled,
        collaboratorPrizeFirst: payload.collaboratorPrizesEnabled ? payload.collaboratorPrizeFirst : null,
        collaboratorPrizeSecond: payload.collaboratorPrizesEnabled ? payload.collaboratorPrizeSecond : null,
        collaboratorPrizeThird: payload.collaboratorPrizesEnabled ? payload.collaboratorPrizeThird : null,
        mysteryPrizes: payload.mysteryPrizes.length
          ? {
            create: payload.mysteryPrizes.map((prize) => ({
              name: prize.name,
              description: `${prize.prizeType === "MONETARY" ? MYSTERY_PRIZE_TYPE_MONETARY : MYSTERY_PRIZE_TYPE_PHYSICAL}${prize.description ?? ""}`,
              value: prize.prizeType === "MONETARY" ? prize.value : 0,
              chance: prize.chance,
              totalAmount: 1,
              remaining: 1,
            })),
          }
          : undefined,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        status: true,
      },
    });

    return jsonNoStore({ success: true, raffle }, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Payload invalido.", 400, {
        issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      });
    }

    console.error("Erro ao criar rifa:", error);
    return jsonError("Erro interno do servidor.", 500);
  }
}

export async function DELETE(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return jsonError("Nao autenticado.", 401);

  const access = await getActiveTenantAccess(authUser.userId);
  if (!access) return jsonError("Organizacao ativa nao encontrada.", 404);

  if (!hasTenantRole(access, [TenantRole.OWNER, TenantRole.ADMIN])) {
    return jsonError("Sem permissao para excluir rifa.", 403);
  }

  const raffleId = String(request.nextUrl.searchParams.get("raffleId") || "").trim();
  if (!raffleId) return jsonError("raffleId e obrigatorio.", 400);

  const raffle = await prisma.raffle.findFirst({
    where: {
      id: raffleId,
      tenantId: access.id,
    },
    select: {
      id: true,
      name: true,
      tickets: {
        select: { id: true },
        take: 1,
      },
      awards: {
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!raffle) return jsonError("Rifa nao encontrada.", 404);

  if (raffle.tickets.length > 0 || raffle.awards.length > 0) {
    return jsonError("Esta rifa possui bilhetes/premios vinculados e nao pode ser removida.", 409);
  }

  await prisma.raffle.delete({
    where: { id: raffle.id },
  });

  return jsonNoStore({
    success: true,
    deleted: {
      id: raffle.id,
      name: raffle.name,
    },
  });
}
