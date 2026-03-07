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
      select: {
        status: true,
        boxesGranted: true,
        client: { select: { cpf: true } },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      status: payment.status,
      boxesGranted: payment.boxesGranted,
      clientCpf: payment.client.cpf,
    });
  } catch (error) {
    console.error('[API Status] Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
