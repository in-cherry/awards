import { NextResponse } from 'next/server';
import { z } from 'zod';
import MercadoPagoConfig, { Payment } from 'mercadopago';
import prisma from '@/lib/prisma';
import { getBoxesForTickets, parseMysteryBoxConfig } from '@/lib/mystery-box';

const pixSchema = z.object({
  slug: z.string().min(1),
  raffleId: z.string().min(1),
  ticketCount: z.number().int().positive(),
  client: z.object({
    name: z.string().min(3),
    cpf: z.string().length(11),
    phone: z.string().min(10),
    email: z.string().email(),
  }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = pixSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { slug, raffleId, ticketCount, client: clientData } = parsed.data;

    // 1. Resolver tenant pelo slug
    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant || !tenant.isActive) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // 2. Validar rifa
    const raffle = await prisma.raffle.findFirst({
      where: { id: raffleId, tenantId: tenant.id, status: 'ACTIVE' },
    });
    if (!raffle) {
      return NextResponse.json({ error: 'Rifa não encontrada ou encerrada' }, { status: 404 });
    }
    if (ticketCount < raffle.minNumbers) {
      return NextResponse.json(
        { error: `Mínimo de ${raffle.minNumbers} bilhetes` },
        { status: 400 }
      );
    }
    if (raffle.nextTicketNumber + ticketCount - 1 > raffle.totalNumbers) {
      return NextResponse.json(
        { error: 'Bilhetes insuficientes disponíveis' },
        { status: 400 }
      );
    }

    // 3. Upsert cliente (isolado por tenant)
    const client = await prisma.client.upsert({
      where: { tenantId_cpf: { tenantId: tenant.id, cpf: clientData.cpf } },
      update: {
        name: clientData.name,
        phone: clientData.phone,
        email: clientData.email,
      },
      create: {
        tenantId: tenant.id,
        name: clientData.name,
        cpf: clientData.cpf,
        phone: clientData.phone,
        email: clientData.email,
      },
    });

    const totalAmount = Number(raffle.price) * ticketCount;

    // 4. Criar pagamento pendente
    const payment = await prisma.payment.create({
      data: {
        tenantId: tenant.id,
        raffleId: raffle.id,
        clientId: client.id,
        amount: totalAmount,
        ticketCount,
        status: 'PENDING',
      },
    });

    // 5. Calcular mystery boxes (preview para metadata)
    const mysteryBoxConfig = parseMysteryBoxConfig(raffle.mysteryBoxConfig);
    const boxesGranted = raffle.mysteryBoxEnabled && mysteryBoxConfig
      ? getBoxesForTickets(ticketCount, mysteryBoxConfig.rules)
      : 0;

    // 6. Gerar pagamento PIX no Mercado Pago
    // Split: se o tenant tem mpRecipientId, direcionamos 80% para ele
    // platform_fee = 20% da transação
    const mpConfig = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN!,
    });
    const mpPayment = new Payment(mpConfig);

    const nameParts = clientData.name.trim().split(' ');
    const firstName = nameParts[0] ?? 'Cliente';
    const lastName = nameParts.slice(1).join(' ') || 'Winzy';

    const mpBody: Record<string, unknown> = {
      transaction_amount: totalAmount,
      payment_method_id: 'pix',
      payer: {
        email: clientData.email,
        first_name: firstName,
        last_name: lastName,
        identification: {
          type: 'CPF',
          number: clientData.cpf,
        },
      },
      description: `${ticketCount} bilhete${ticketCount > 1 ? 's' : ''} — ${raffle.title}`,
      external_reference: payment.id,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhooks/mercadopago`,
      metadata: {
        payment_db_id: payment.id,
        raffle_id: raffle.id,
        tenant_id: tenant.id,
        ticket_count: ticketCount,
        boxes_granted: boxesGranted,
      },
    };

    // Split: se tenant tem conta MP conectada, cobrar application_fee
    if (tenant.mpRecipientId) {
      mpBody.application_fee = parseFloat((totalAmount * 0.20).toFixed(2));
      mpBody.collector_id = Number(tenant.mpRecipientId);
    }

    const mpResult = await mpPayment.create({ body: mpBody });

    const qrCode =
      (mpResult as unknown as { point_of_interaction?: { transaction_data?: { qr_code?: string } } })
        ?.point_of_interaction?.transaction_data?.qr_code ?? '';
    const qrCodeBase64 =
      (mpResult as unknown as { point_of_interaction?: { transaction_data?: { qr_code_base64?: string } } })
        ?.point_of_interaction?.transaction_data?.qr_code_base64 ?? '';

    // 7. Atualizar pagamento com dados do MP
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        externalId: String(mpResult.id),
        qrCode,
        qrCodeBase64,
      },
    });

    return NextResponse.json({
      paymentId: payment.id,
      qrCode,
      qrCodeBase64,
      amount: totalAmount,
    });
  } catch (error) {
    console.error('[API PIX] Erro:', error);
    return NextResponse.json({ error: 'Erro interno ao gerar pagamento' }, { status: 500 });
  }
}

