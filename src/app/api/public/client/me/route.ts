import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/database/prisma";
import { getClientAuthUser } from "@/lib/auth/mddleware";

export async function GET(request: NextRequest) {
  try {
    const authClient = await getClientAuthUser();
    if (!authClient || !authClient.tenantId) {
      return NextResponse.json({ success: false, error: "Nao autenticado." }, { status: 401 });
    }

    const slug = String(request.nextUrl.searchParams.get("slug") || "").trim().toLowerCase();
    if (!slug) {
      return NextResponse.json({ success: false, error: "Slug obrigatorio." }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, slug: true, name: true },
    });

    if (!tenant || tenant.id !== authClient.tenantId) {
      return NextResponse.json({ success: false, error: "Sessao invalida para esta organizacao." }, { status: 403 });
    }

    const client = await prisma.client.findFirst({
      where: {
        id: authClient.userId,
        tenantId: tenant.id,
      },
      include: {
        profile: true,
        awards: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            type: true,
            claimedType: true,
            createdAt: true,
            raffle: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        tickets: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            number: true,
            createdAt: true,
            raffle: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                drawDate: true,
              },
            },
            payment: {
              select: {
                id: true,
                status: true,
                totalValue: true,
                amount: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: "Cliente nao encontrado." }, { status: 404 });
    }

    const raffleMap = new Map<string, {
      raffleId: string;
      raffleName: string;
      raffleSlug: string;
      raffleStatus: string;
      drawDate: string | null;
      ticketsCount: number;
      lastTicketAt: string | null;
      totalSpent: number;
    }>();

    for (const ticket of client.tickets) {
      const key = ticket.raffle.id;
      const current = raffleMap.get(key) || {
        raffleId: ticket.raffle.id,
        raffleName: ticket.raffle.name,
        raffleSlug: ticket.raffle.slug,
        raffleStatus: ticket.raffle.status,
        drawDate: ticket.raffle.drawDate ? ticket.raffle.drawDate.toISOString() : null,
        ticketsCount: 0,
        lastTicketAt: null,
        totalSpent: 0,
      };

      current.ticketsCount += 1;
      const createdAtIso = ticket.createdAt.toISOString();
      if (!current.lastTicketAt || current.lastTicketAt < createdAtIso) {
        current.lastTicketAt = createdAtIso;
      }

      if (ticket.payment && ticket.payment.status === "COMPLETED") {
        const totalValue = Number(ticket.payment.totalValue);
        const amount = Math.max(ticket.payment.amount, 1);
        current.totalSpent += totalValue / amount;
      }

      raffleMap.set(key, current);
    }

    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        cpf: client.cpf,
        profile: {
          nickname: client.profile?.nickname ?? null,
          avatar: client.profile?.avatar ?? null,
          banner: client.profile?.banner ?? null,
        },
      },
      tenant,
      awards: client.awards.map((award) => ({
        id: award.id,
        name: award.name,
        type: award.type,
        claimedType: award.claimedType,
        createdAt: award.createdAt.toISOString(),
        raffle: award.raffle,
      })),
      tickets: client.tickets.map((ticket) => ({
        id: ticket.id,
        number: String(ticket.number).padStart(6, "0"),
        createdAt: ticket.createdAt.toISOString(),
        raffle: ticket.raffle,
        payment: ticket.payment
          ? {
            id: ticket.payment.id,
            status: ticket.payment.status,
            totalValue: Number(ticket.payment.totalValue),
            amount: ticket.payment.amount,
            createdAt: ticket.payment.createdAt.toISOString(),
          }
          : null,
      })),
      raffles: Array.from(raffleMap.values()).sort((a, b) => (b.lastTicketAt || "").localeCompare(a.lastTicketAt || "")),
    });
  } catch (error) {
    console.error("Erro ao buscar perfil do cliente:", error);
    return NextResponse.json({ success: false, error: "Erro interno do servidor." }, { status: 500 });
  }
}
