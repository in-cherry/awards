import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { randomInt } from 'crypto';
import {
  appendOpenedMysteryBoxToMetadata,
  readOpenedMysteryBoxes,
} from '@/core/mystery-box/opened-box-state';

const MYSTERY_BOX_WIN_PROBABILITY = 0.1;
const RANDOM_SCALE = 1_000_000;

function attemptMysteryBoxWinAtTenPercent(): boolean {
  const threshold = Math.floor(MYSTERY_BOX_WIN_PROBABILITY * RANDOM_SCALE);
  const draw = randomInt(0, RANDOM_SCALE);
  return draw < threshold;
}

const schema = z.object({
  paymentId: z.string().min(1),
  boxIndex: z.number().int().min(0),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const { paymentId, boxIndex } = parsed.data;

    // 1. Carregar pagamento com raffle e boxes já abertas
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        status: true,
        ticketCount: true,
        boxesGranted: true,
        clientId: true,
        raffleId: true,
        raffle: {
          select: {
            mysteryBoxEnabled: true,
            mysteryBoxConfig: true,
          },
        },
        mysteryWon: {
          select: {
            id: true,
            boxIndex: true,
            prizeId: true,
            prize: {
              select: {
                title: true,
                description: true,
              },
            },
          },
        },
        tickets: {
          select: { number: true },
          take: 1,
          orderBy: { number: 'asc' },
        },
        metadata: true,
      },
    });

    if (!payment || payment.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Pagamento não encontrado ou não aprovado' }, { status: 404 });
    }

    if (!payment.raffle.mysteryBoxEnabled) {
      return NextResponse.json({ error: 'Mystery Box não habilitada nesta rifa' }, { status: 400 });
    }

    // 2. Validar que o boxIndex é válido e ainda não foi aberto
    if (boxIndex >= payment.boxesGranted) {
      return NextResponse.json({ error: 'Caixa inválida' }, { status: 400 });
    }

    const openedFromMetadata = readOpenedMysteryBoxes(payment.metadata);
    const openedFromWinners = payment.mysteryWon.map((winner: any) => ({
      boxIndex: winner.boxIndex,
      won: true,
      prizeId: winner.prizeId,
      openedAt: new Date().toISOString(),
    }));
    const mergedOpenedByBox = new Map<number, { boxIndex: number; won: boolean; prizeId?: string; openedAt: string }>();
    for (const opened of [...openedFromMetadata, ...openedFromWinners]) {
      mergedOpenedByBox.set(opened.boxIndex, opened);
    }
    const mergedOpened = Array.from(mergedOpenedByBox.values());

    const alreadyOpened = mergedOpened.some((opened) => opened.boxIndex === boxIndex);
    if (alreadyOpened) {
      const openedWinner = payment.mysteryWon.find((winner: any) => winner.boxIndex === boxIndex);
      if (openedWinner) {
        return NextResponse.json({
          won: true,
          prize: {
            id: openedWinner.prizeId,
            name: openedWinner.prize.title,
            description: openedWinner.prize.description,
          },
          winnerId: openedWinner.id,
          boxesOpened: mergedOpened.length,
          boxesTotal: payment.boxesGranted,
        });
      }

      return NextResponse.json({
        won: false,
        boxesOpened: mergedOpened.length,
        boxesTotal: payment.boxesGranted,
        openedBox: {
          id: `no-prize-${boxIndex}`,
          boxIndex,
          prizeId: '',
          prizeName: '',
        },
      });
    }

    // 3. Decidir se ganhou com probabilidade real fixa de 10%
    const won = attemptMysteryBoxWinAtTenPercent();

    if (!won) {
      const updatedMetadata = appendOpenedMysteryBoxToMetadata(payment.metadata, {
        boxIndex,
        won: false,
        openedAt: new Date().toISOString(),
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: { metadata: updatedMetadata },
      });

      return NextResponse.json({
        won: false,
        boxesOpened: mergedOpened.length + 1,
        boxesTotal: payment.boxesGranted,
        openedBox: {
          id: `no-prize-${boxIndex}`,
          boxIndex,
          prizeId: '',
          prizeName: '',
        },
      });
    }

    // 4. Buscar prêmio disponível (com remaining > 0)
    const availablePrize = await prisma.mysteryPrize.findFirst({
      where: {
        raffleId: payment.raffleId,
        remaining: { gt: 0 },
      },
      orderBy: { remaining: 'asc' }, // Prêmio com menor estoque primeiro
    });

    if (!availablePrize) {
      const updatedMetadata = appendOpenedMysteryBoxToMetadata(payment.metadata, {
        boxIndex,
        won: false,
        openedAt: new Date().toISOString(),
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: { metadata: updatedMetadata },
      });

      return NextResponse.json({
        won: false,
        boxesOpened: mergedOpened.length + 1,
        boxesTotal: payment.boxesGranted,
        openedBox: {
          id: `no-prize-${boxIndex}`,
          boxIndex,
          prizeId: '',
          prizeName: '',
        },
      });
    }

    // 5. Usar primeiro ticket do pagamento como "número da sorte"
    const luckyTicket = payment.tickets[0]?.number ?? 0;

    // 6. Transação: criar winner + decrementar estoque do prêmio
    // Registra ganho
    const winner = await prisma.$transaction(async (tx: any) => {
      // Decrementar remaining
      await tx.mysteryPrize.update({
        where: { id: availablePrize.id },
        data: { remaining: { decrement: 1 } },
      });

      const createdWinner = await tx.mysteryPrizeWinner.create({
        data: {
          prizeId: availablePrize.id,
          clientId: payment.clientId,
          paymentId: payment.id,
          boxIndex,
          ticketNumber: luckyTicket,
        },
        select: { id: true },
      });

      const updatedMetadata = appendOpenedMysteryBoxToMetadata(payment.metadata, {
        boxIndex,
        won: true,
        prizeId: availablePrize.id,
        openedAt: new Date().toISOString(),
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: { metadata: updatedMetadata },
      });

      return createdWinner;
    });

    return NextResponse.json({
      won: true,
      prize: {
        id: availablePrize.id,
        name: availablePrize.title,
        description: availablePrize.description,
      },
      winnerId: winner.id,
      boxesOpened: mergedOpened.length + 1,
      boxesTotal: payment.boxesGranted,
      openedBox: {
        id: winner.id,
        boxIndex,
        prizeId: availablePrize.id,
        prizeName: availablePrize.title,
      },
    });
  } catch (error) {
    console.error('[Mystery Box] Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
