import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { cpf, tenantSlug } = await request.json();

    if (!cpf || !tenantSlug) {
      return NextResponse.json(
        { success: false, error: 'CPF e tenant são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar o tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant não encontrado' },
        { status: 404 }
      );
    }

    // Procurar cliente pelo CPF no tenant
    const client = await prisma.client.findUnique({
      where: {
        tenantId_cpf: {
          tenantId: tenant.id,
          cpf: cpf
        }
      },
      select: {
        name: true,
        cpf: true,
      }
    });

    if (client) {
      return NextResponse.json({
        success: true,
        exists: true,
        client: {
          name: client.name,
          cpf: client.cpf,
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        exists: false
      });
    }

  } catch (error) {
    console.error('Erro ao verificar cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}