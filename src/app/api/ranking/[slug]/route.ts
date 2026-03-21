import prisma from "@/lib/database/prisma";
import { NextResponse } from "next/server";
import { getClientAuthUser } from "@/lib/auth/mddleware";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const authClient = await getClientAuthUser();

    const tenant = await prisma.tenant.findUnique({
      where: { slug }
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const ranking = await prisma.client.findMany({
      where: {
        tenantId: tenant.id,
        tickets: {
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: { tickets: true }
        }
      },
      orderBy: { tickets: { _count: "desc" } },
      take: 3
    });

    let userPosition: { position: number; tickets: number } | null = null;

    if (authClient && authClient.tenantId === tenant.id) {
      const userWithTicketCount = await prisma.client.findFirst({
        where: {
          id: authClient.userId,
          tenantId: tenant.id,
        },
        select: {
          id: true,
          _count: {
            select: { tickets: true },
          },
        },
      });

      const currentUserTickets = userWithTicketCount?._count.tickets ?? 0;

      if (currentUserTickets > 0) {
        const fullRanking = await prisma.client.findMany({
          where: {
            tenantId: tenant.id,
            tickets: {
              some: {},
            },
          },
          select: {
            id: true,
            _count: {
              select: { tickets: true },
            },
          },
          orderBy: [
            { tickets: { _count: "desc" } },
            { createdAt: "asc" },
          ],
        });

        const index = fullRanking.findIndex((entry) => entry.id === authClient.userId);

        if (index >= 0) {
          userPosition = {
            position: index + 1,
            tickets: currentUserTickets,
          };
        }
      }
    }

    const formattedRanking = ranking.map((entry, index) => {
      const [firstName, lastName] = entry.name.trim().split(/\s+/);
      const displayName = lastName ? `${firstName} ${lastName}` : firstName;

      return {
        position: index + 1,
        name: displayName,
        tickets: entry._count.tickets,
        color: index === 0 ? 'border-amber-400/30 bg-amber-500/20 text-amber-400' :
          index === 1 ? 'border-stone-500/20 bg-stone-500/20 text-stone-300' :
            index === 2 ? 'border-orange-500/30 bg-orange-700/20 text-orange-400' : 'border-white/10 bg-white/5 text-stone-400'
      };
    });

    return NextResponse.json({
      success: true,
      ranking: formattedRanking,
      userPosition,
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}