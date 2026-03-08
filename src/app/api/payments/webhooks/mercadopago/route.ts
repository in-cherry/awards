import { NextResponse } from 'next/server';
import MercadoPagoConfig, { Payment } from 'mercadopago';
import prisma from '@/lib/prisma';
import { getBoxesForTickets, parseMysteryBoxConfig } from '@/lib/mystery-box';

const mpConfig = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});
const mpPayment = new Payment(mpConfig);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('[WEBHOOK] Recebido:', JSON.stringify(body, null, 2));

    // MP envia notificação de payment.updated ou tipo "payment"
    const paymentId: string | undefined =
      body?.data?.id ?? body?.id;

    if (!paymentId) {
      console.log('[WEBHOOK] ID de pagamento não encontrado');
      return NextResponse.json({ received: true });
    }

    console.log(`[WEBHOOK] Processando pagamento MP ID: ${paymentId}`);

    // Buscar status atualizado diretamente na API do MP
    const mpData = await mpPayment.get({ id: String(paymentId) });
    console.log(`[WEBHOOK] Status MP: ${mpData.status}`);
    console.log(`[WEBHOOK] Valor MP: R$ ${mpData.transaction_amount}`);

    if (mpData.status !== 'approved') {
      console.log(`[WEBHOOK] Pagamento não aprovado (${mpData.status}) - ignorando`);
      return NextResponse.json({ received: true });
    }

    // Pegar o ID interno pelo external_reference (ou externalId)
    const externalRef: string =
      (mpData as unknown as { external_reference?: string }).external_reference ??
      String(mpData.id);

    console.log(`[WEBHOOK] External reference: ${externalRef}`);

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { externalId: String(mpData.id) },
          { id: externalRef },
        ],
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        raffle: {
          select: {
            id: true,
            title: true,
            totalNumbers: true,
            mysteryBoxEnabled: true,
            mysteryBoxConfig: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            cpf: true,
          },
        },
      },
    });

    if (!payment) {
      console.error(`[WEBHOOK] Pagamento não encontrado no DB para MP ID: ${paymentId}`);
      return NextResponse.json({ received: true });
    }

    if (payment.status === 'APPROVED') {
      console.log(`[WEBHOOK] Pagamento já processado: ${payment.id}`);
      return NextResponse.json({ received: true });
    }

    console.log(`[WEBHOOK] Processando pagamento DB ID: ${payment.id}`);
    console.log(`[WEBHOOK] Cliente: ${payment.client.name} (${payment.client.cpf})`);
    console.log(`[WEBHOOK] Rifa: ${payment.raffle.title}`);
    console.log(`[WEBHOOK] Tenant: ${payment.tenant.name} (${payment.tenant.slug})`);
    console.log(`[WEBHOOK] Bilhetes: ${payment.ticketCount}`);

    // =====================================================
    // ALOCAÇÃO EFICIENTE DE TICKETS
    // Usamos nextTicketNumber atômico para evitar colisões.
    // Sem loops, sem SELECT de numbers existentes.
    // Suporta rifas com 1M+ números sem gargalo.
    // =====================================================
    const ticketCount = payment.ticketCount;

    // Atualizar nextTicketNumber atomicamente e pegar o valor anterior
    const updatedRaffle = await prisma.$transaction(async (tx) => {
      const raffle = await tx.raffle.findUnique({
        where: { id: payment.raffleId },
        select: { nextTicketNumber: true, totalNumbers: true },
      });
      if (!raffle) throw new Error('Rifa não encontrada');

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

    // Gerar números de forma sequencial (O(n) apenas para criar os dados)
    const ticketsData = Array.from({ length: ticketCount }, (_, i) => ({
      raffleId: payment.raffleId,
      clientId: payment.clientId,
      paymentId: payment.id,
      number: startNumber + i,
    }));

    console.log(`[WEBHOOK] Alocando bilhetes: ${startNumber} a ${startNumber + ticketCount - 1}`);

    // Calcular caixas misteriosas concedidas
    let boxesGranted = 0;
    if (payment.raffle.mysteryBoxEnabled) {
      const config = parseMysteryBoxConfig(payment.raffle.mysteryBoxConfig);
      if (config) {
        boxesGranted = getBoxesForTickets(ticketCount, config.rules);
        console.log(`[WEBHOOK] Mystery boxes concedidas: ${boxesGranted}`);
      }
    }

    // Execução em transação: criar tickets + aprovar pagamento
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
            ...((payment.metadata as any) || {}),
            webhook_processed_at: new Date().toISOString(),
            mp_final_status: mpData.status,
            mp_final_amount: mpData.transaction_amount,
            tickets_allocated: {
              start: startNumber,
              end: startNumber + ticketCount - 1,
              total: ticketCount,
            },
          },
        },
      }),
    ]);

    console.log(`[WEBHOOK] ✅ Pagamento processado com sucesso!`);
    console.log(`[WEBHOOK] - ID: ${payment.id}`);
    console.log(`[WEBHOOK] - Cliente: ${payment.client.name}`);
    console.log(`[WEBHOOK] - Bilhetes: ${startNumber} a ${startNumber + ticketCount - 1}`);
    console.log(`[WEBHOOK] - Mystery Boxes: ${boxesGranted}`);

    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    console.error('[Webhook MP] Erro detalhado:', error);

    // Log mais detalhado do erro
    if (error instanceof Error) {
      console.error('[Webhook MP] Message:', error.message);
      console.error('[Webhook MP] Stack:', error.stack);
    }

    // Retornar 200 mesmo em erro para evitar reenvio infinito do MP
    return NextResponse.json({
      received: true,
      error: true,
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

