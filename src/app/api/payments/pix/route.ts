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

    // 6. Configurar URL base
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    // 7. Criar pagamento PIX no Mercado Pago
    // Usa o token do lojista se conectado (OAuth), se não, usa o da plataforma temporariamente
    const mpConfig = new MercadoPagoConfig({
      accessToken: tenant.mpAccessToken || process.env.MP_ACCESS_TOKEN!,
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
      description: `${ticketCount} bilhete${ticketCount > 1 ? 's' : ''} — ${raffle.title} (${tenant.name})`,
      statement_descriptor: tenant.name.substring(0, 13),
      external_reference: payment.id,
      metadata: {
        payment_db_id: payment.id,
        raffle_id: raffle.id,
        tenant_id: tenant.id,
        tenant_slug: tenant.slug,
        ticket_count: ticketCount,
        boxes_granted: boxesGranted,
        total_amount: totalAmount,
      },
    };

    // Se estiver usando o token do tenant via OAuth, aplica a taxa da plataforma
    if (tenant.mpAccessToken) {
      const platformFeePercentage = Number(process.env.PLATFORM_FEE_PERCENTAGE || 20);
      mpBody.application_fee = Number((totalAmount * (platformFeePercentage / 100)).toFixed(2));
    }

    // notification_url só é válida em produção (MP rejeita URLs localhost)
    if (!baseUrl.includes('localhost')) {
      mpBody.notification_url = `${baseUrl}/api/webhooks/mercadopago`;
    }

    console.log('[MP] Criando pagamento PIX...');
    const mpResult = await mpPayment.create({ body: mpBody });

    console.log(`[MP] Pagamento criado — ID: ${mpResult.id} | Status: ${mpResult.status}`);

    const qrCode =
      (mpResult as unknown as { point_of_interaction?: { transaction_data?: { qr_code?: string } } })
        ?.point_of_interaction?.transaction_data?.qr_code ?? '';
    const qrCodeBase64 =
      (mpResult as unknown as { point_of_interaction?: { transaction_data?: { qr_code_base64?: string } } })
        ?.point_of_interaction?.transaction_data?.qr_code_base64 ?? '';

    if (!qrCode || !qrCodeBase64) {
      throw new Error('QR Code PIX não foi gerado pelo Mercado Pago');
    }

    // 8. Atualizar pagamento com dados do MP
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        externalId: String(mpResult.id),
        qrCode,
        qrCodeBase64,
        metadata: {
          mp_id: mpResult.id,
          mp_status: mpResult.status,
          mp_date_created: mpResult.date_created,
        },
      },
    });

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      qrCode,
      qrCodeBase64,
      amount: totalAmount,
      expiresAt: mpResult.date_of_expiration,
      details: {
        mercadoPagoId: mpResult.id,
        status: mpResult.status,
        ticketCount,
        raffleTitle: raffle.title,
        clientName: client.name,
        mysteryBoxes: boxesGranted,
      },
    });
  } catch (error) {
    console.error('[API PIX] Erro detalhado:', error);

    // Melhor tratamento de erros específicos do Mercado Pago
    if (error && typeof error === 'object' && 'cause' in error) {
      const mpError = (error as any).cause;
      if (mpError && mpError.message) {
        console.error('[MP Error]:', mpError.message);
        return NextResponse.json({
          error: 'Erro no Mercado Pago',
          details: mpError.message
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      error: 'Erro interno ao gerar pagamento PIX',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

