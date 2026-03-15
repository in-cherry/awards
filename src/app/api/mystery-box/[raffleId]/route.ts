import prisma from "@/lib/database/prisma";
import { NextResponse } from "next/server";

// mystery-box/[raffleId] # API de consumo de dados de um sorteio específico
export async function GET(request: Request, { params }: { params: Promise<{ raffleId: string }> }) {
  try {
    const { raffleId } = await params;

    const raffle = await prisma.raffle.findUnique({
      where: { id: raffleId },
      select: {
        id: true,
        mysteryBoxEnabled: true,
        mysteryPrizes: {
          where: { remaining: { gt: 0 } },
          select: {
            id: true,
            title: true,
            description: true,
            totalAmount: true,
            remaining: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!raffle) {
      return NextResponse.json({ error: "Raffle not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, raffle });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}