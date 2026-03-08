import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true,
            phone: true,
          }
        },
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
            price: true,
          },
        },
        tickets: {
          select: {
            id: true,
            number: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    // Construir resposta com todas as informações
    return NextResponse.json({
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      ticketCount: payment.ticketCount,
      boxesGranted: payment.boxesGranted,
      createdAt: payment.createdAt,
      processedAt: payment.processedAt,
      externalId: payment.externalId,

      client: {
        name: payment.client.name,
        cpf: payment.client.cpf,
        email: payment.client.email,
        phone: payment.client.phone,
      },

      tenant: {
        name: payment.tenant.name,
        slug: payment.tenant.slug,
      },

      raffle: {
        title: payment.raffle.title,
        unitPrice: payment.raffle.price,
      },

      tickets: payment.tickets.map(ticket => ({
        id: ticket.id,
        number: ticket.number,
      })),

      // Status amigável para frontend
      statusInfo: {
        isPending: payment.status === 'PENDING',
        isApproved: payment.status === 'APPROVED',
        isCancelled: payment.status === 'CANCELLED',
        displayText: payment.status === 'PENDING' ? 'Aguardando Pagamento' :
          payment.status === 'APPROVED' ? 'Pagamento Aprovado' :
            payment.status === 'CANCELLED' ? 'Pagamento Cancelado' :
              payment.status,
      },
    });
  } catch (error) {
    console.error('[API Status] Erro:', error);
    return NextResponse.json({
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 });
  }
}
