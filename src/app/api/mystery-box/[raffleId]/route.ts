import prisma from "@/lib/database/prisma";
import { NextResponse } from "next/server";

const MYSTERY_PRIZE_TYPE_MONETARY = "[[TYPE:MONETARY]]";
const MYSTERY_PRIZE_TYPE_PHYSICAL = "[[TYPE:PHYSICAL]]";

// mystery-box/[raffleId] # API de consumo de dados de um sorteio específico
export async function GET(request: Request, { params }: { params: Promise<{ raffleId: string }> }) {
  try {
    const { raffleId } = await params;

    const raffle = await prisma.raffle.findUnique({
      where: { id: raffleId },
      select: {
        id: true,
        mysteryPrizes: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            description: true,
            value: true,
            chance: true,
            remaining: true,
            totalAmount: true,
          },
        },
      },
    });

    if (!raffle) {
      return NextResponse.json({ error: "Raffle not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      raffle: {
        id: raffle.id,
        mysteryBoxEnabled: raffle.mysteryPrizes.length > 0,
      },
      prizes: raffle.mysteryPrizes.map((prize) => {
        const monetaryValue = Number(prize.value);
        const rawDescription = prize.description ?? "";
        const hasMonetaryMarker = rawDescription.startsWith(MYSTERY_PRIZE_TYPE_MONETARY);
        const hasPhysicalMarker = rawDescription.startsWith(MYSTERY_PRIZE_TYPE_PHYSICAL);
        const cleanDescription = hasMonetaryMarker
          ? rawDescription.slice(MYSTERY_PRIZE_TYPE_MONETARY.length).trim()
          : hasPhysicalMarker
            ? rawDescription.slice(MYSTERY_PRIZE_TYPE_PHYSICAL.length).trim()
            : rawDescription.trim();

        const isMonetaryPrize = hasMonetaryMarker && Number.isFinite(monetaryValue) && monetaryValue > 0;

        return {
          id: prize.id,
          title: prize.name,
          description: cleanDescription || null,
          value: monetaryValue,
          prizeType: isMonetaryPrize ? "MONETARY" : "PHYSICAL",
          chance: Number(prize.chance),
          remaining: prize.remaining,
          totalAmount: prize.totalAmount,
        };
      }),
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}