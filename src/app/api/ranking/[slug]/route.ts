import prisma from "@/lib/database/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const tenant = await prisma.tenant.findUnique({
      where: { slug }
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const ranking = await prisma.client.findMany({
      where: { tenantId: tenant.id },
      select: {
        name: true,
        _count: {
          select: { tickets: true }
        }
      },
      orderBy: { tickets: { _count: "desc" } },
      take: 3
    })

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

    return NextResponse.json({ success: true, ranking: formattedRanking });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}