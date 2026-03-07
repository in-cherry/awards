import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Buscar o tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug }
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant não encontrado' },
        { status: 404 }
      );
    }

    // Buscar ranking de clientes por quantidade de tickets
    const ranking = await prisma.client.findMany({
      where: { tenantId: tenant.id },
      select: {
        name: true,
        _count: {
          select: { tickets: true }
        }
      },
      orderBy: {
        tickets: { _count: 'desc' }
      },
      take: 10 // Top 10
    });

    // Formatar dados para o frontend
    const formattedRanking = ranking
      .filter(client => client._count.tickets > 0) // Apenas clientes com tickets
      .map((client, index) => ({
        rank: index + 1,
        name: client.name,
        ticketCount: client._count.tickets,
        color: index === 0 ? 'bg-yellow-500' :
          index === 1 ? 'bg-slate-300' :
            index === 2 ? 'bg-orange-400' : 'bg-white/5'
      }));

    return NextResponse.json({
      success: true,
      ranking: formattedRanking
    });

  } catch (error) {
    console.error('Erro ao buscar ranking:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}