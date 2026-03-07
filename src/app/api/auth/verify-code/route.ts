import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, code, cpf, name, email, slug } = body;

    if (!phone || !code || !slug) {
      return NextResponse.json(
        { error: 'Telefone, código e slug são obrigatórios' },
        { status: 400 }
      );
    }

    // Resolver tenant
    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Buscar código de verificação (tenant-scoped)
    const verification = await prisma.verificationCode.findFirst({
      where: { tenantId: tenant.id, phone, code },
    });

    if (!verification) {
      return NextResponse.json({ error: 'Código inválido ou incorreto' }, { status: 400 });
    }

    if (new Date() > verification.expiresAt) {
      await prisma.verificationCode.delete({ where: { id: verification.id } });
      return NextResponse.json(
        { error: 'Este código já expirou. Solicite um novo.' },
        { status: 400 }
      );
    }

    // Código válido — apagar para evitar reuso
    await prisma.verificationCode.delete({ where: { id: verification.id } });

    // Upsert cliente isolado por tenant
    const cpfClean = cpf?.replace?.(/\D/g, '') ?? '';

    if (!cpfClean) {
      return NextResponse.json({ error: 'CPF é obrigatório' }, { status: 400 });
    }

    const client = await prisma.client.upsert({
      where: { tenantId_cpf: { tenantId: tenant.id, cpf: cpfClean } },
      update: { phone, ...(name && { name }), ...(email && { email }) },
      create: {
        tenantId: tenant.id,
        name: name ?? 'Usuário',
        cpf: cpfClean,
        phone,
        email: email ?? `${cpfClean}@naoinformado.com`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Autenticação bem-sucedida',
      user: {
        id: client.id,
        name: client.name,
        cpf: client.cpf,
        phone: client.phone,
        email: client.email,
      },
    });
  } catch (error) {
    console.error('[Verify Code] Erro:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
