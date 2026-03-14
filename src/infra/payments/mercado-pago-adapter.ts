import { NextResponse } from 'next/server';
import MercadoPagoConfig, { Payment } from 'mercadopago';
import prisma from '@/lib/prisma';
import { getBoxesForTickets, parseMysteryBoxConfig } from '@/lib/mystery-box';
import { formatTicketNumber } from '@/core/tickets/format';

type WebhookPayload = {
  data?: { id?: string | number };
  id?: string | number;
};

export class MercadoPagoAdapter {
  private readonly mpPayment: Payment;

  constructor() {
    const mpConfig = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN!,
    });

    this.mpPayment = new Payment(mpConfig);
  }

  async processWebhook(req: Request) {
    try {
      const body = (await req.json()) as WebhookPayload;
      const paymentId = body?.data?.id ?? body?.id;

      if (!paymentId) {
        return NextResponse.json({ received: true });
      }

      const mpData = await this.mpPayment.get({ id: String(paymentId) });
      if (mpData.status !== 'approved') {
        return NextResponse.json({ received: true });
      }

      const externalRef =
        (mpData as unknown as { external_reference?: string }).external_reference ?? String(mpData.id);

      const payment = await prisma.payment.findFirst({
        where: { OR: [{ externalId: String(mpData.id) }, { id: externalRef }] },
        include: {
          raffle: {
            select: {
              id: true,
              title: true,
              totalNumbers: true,
              mysteryBoxEnabled: true,
              mysteryBoxConfig: true,
            },
          },
        },
      });

      if (!payment || payment.status === 'APPROVED') {
        return NextResponse.json({ received: true });
      }

      const ticketCount = payment.ticketCount;

      const updatedRaffle = await prisma.$transaction(async (tx) => {
        const raffle = await tx.raffle.findUnique({
          where: { id: payment.raffleId },
          select: { nextTicketNumber: true, totalNumbers: true },
        });

        if (!raffle) {
          throw new Error('Rifa nao encontrada');
        }

        const startNumber = raffle.nextTicketNumber;
        const endNumber = startNumber + ticketCount - 1;

        if (endNumber > raffle.totalNumbers) {
          throw new Error('Bilhetes esgotados');
        }

        await tx.raffle.update({
          where: { id: payment.raffleId },
          data: { nextTicketNumber: { increment: ticketCount } },
        });

        return { startNumber };
      });

      const { startNumber } = updatedRaffle;

      const ticketsData = Array.from({ length: ticketCount }, (_, index) => {
        const number = startNumber + index;
        return {
          raffleId: payment.raffleId,
          clientId: payment.clientId,
          paymentId: payment.id,
          number,
          numberFormatted: formatTicketNumber(number),
        };
      });

      let boxesGranted = 0;
      if (payment.raffle.mysteryBoxEnabled) {
        const config = parseMysteryBoxConfig(payment.raffle.mysteryBoxConfig);
        if (config) {
          boxesGranted = getBoxesForTickets(ticketCount, config.rules);
        }
      }

      await prisma.$transaction([
        prisma.ticket.createMany({ data: ticketsData }),
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'APPROVED',
            externalId: String(mpData.id),
            boxesGranted,
            processedAt: new Date(),
            metadata: {
              ...(payment.metadata && typeof payment.metadata === 'object' ? payment.metadata : {}),
              webhook_processed_at: new Date().toISOString(),
              mp_final_status: mpData.status,
              mp_final_amount: mpData.transaction_amount,
              tickets_allocated: {
                start: startNumber,
                end: startNumber + ticketCount - 1,
                startFormatted: formatTicketNumber(startNumber),
                endFormatted: formatTicketNumber(startNumber + ticketCount - 1),
                total: ticketCount,
              },
            },
          },
        }),
      ]);

      return NextResponse.json({ received: true, processed: true });
    } catch (error) {
      console.error('[MercadoPagoAdapter] Webhook error:', error);
      return NextResponse.json({
        received: true,
        error: true,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }
}
