import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { attemptMysteryBoxWin, parseMysteryBoxConfig } from '@/lib/mystery-box';

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
          select: { boxIndex: true },
        },
        tickets: {
          select: { number: true },
          take: 1,
          orderBy: { number: 'asc' },
        },
      },
    });

    if (!payment || payment.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Pagamento não encontrado ou não aprovado' }, { status: 404 });
    }

    if (!payment.raffle.mysteryBoxEnabled) {
      return NextResponse.json({ error: 'Mystery Box não habilitada nesta rifa' }, { status: 400 });
    }

    const config = parseMysteryBoxConfig(payment.raffle.mysteryBoxConfig);
    if (!config) {
      return NextResponse.json({ error: 'Configuração de mystery box inválida' }, { status: 500 });
    }

    // 2. Validar que o boxIndex é válido e ainda não foi aberto
    if (boxIndex >= payment.boxesGranted) {
      return NextResponse.json({ error: 'Caixa inválida' }, { status: 400 });
    }

    const alreadyOpened = payment.mysteryWon.some((w) => w.boxIndex === boxIndex);
    if (alreadyOpened) {
      return NextResponse.json({ error: 'Esta caixa já foi aberta' }, { status: 400 });
    }

    // 3. Decidir se ganhou (probabilidade real e justa)
    const won = attemptMysteryBoxWin(config.winProbability);

    if (!won) {
      // Sem prêmio — registrar box como aberta sem prêmio usando um "prize vazio"
      // Para manter rastreabilidade, criamos um registro em MysteryPrizeWinner sem prêmio
      // Porém nosso modelo requer um prizeId. Usamos uma abordagem alternativa:
      // Não criar registro — apenas retornar que não ganhou.
      // O frontend rastreia pelo boxIndex da lista que voltou do servidor.
      // Para persistência, usaríamos uma tabela separada de "caixas abertas".
      // Por ora, o frontend adiciona uma entrada local com prizeName=''.
      return NextResponse.json({
        won: false,
        boxesOpened: payment.mysteryWon.length + 1,
        boxesTotal: payment.boxesGranted,
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
      // Ganhou mas não há prêmios disponíveis
      return NextResponse.json({
        won: false,
        boxesOpened: payment.mysteryWon.length + 1,
        boxesTotal: payment.boxesGranted,
      });
    }

    // 5. Usar primeiro ticket do pagamento como "número da sorte"
    const luckyTicket = payment.tickets[0]?.number ?? 0;

    // 6. Transação: criar winner + decrementar estoque do prêmio
    const winner = await prisma.$transaction(async (tx) => {
      // Decrementar remaining
      await tx.mysteryPrize.update({
        where: { id: availablePrize.id },
        data: { remaining: { decrement: 1 } },
      });

      return tx.mysteryPrizeWinner.create({
        data: {
          prizeId: availablePrize.id,
          clientId: payment.clientId,
          paymentId: payment.id,
          boxIndex,
          ticketNumber: luckyTicket,
        },
        select: { id: true },
      });
    });

    return NextResponse.json({
      won: true,
      prize: {
        id: availablePrize.id,
        name: availablePrize.title,
        description: availablePrize.description,
      },
      winnerId: winner.id,
      boxesOpened: payment.mysteryWon.length + 1,
      boxesTotal: payment.boxesGranted,
    });
  } catch (error) {
    console.error('[Mystery Box] Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
