import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, cpf, slug } = body;

    if (!phone || !slug) {
      return NextResponse.json(
        { error: 'Telefone e slug são obrigatórios' },
        { status: 400 }
      );
    }

    // Resolver tenant pelo slug
    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Limpar códigos anteriores do mesmo telefone neste tenant
    await prisma.verificationCode.deleteMany({
      where: { tenantId: tenant.id, phone },
    });

    // Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

    await prisma.verificationCode.create({
      data: { tenantId: tenant.id, phone, code, expiresAt },
    });

    // Em produção: enviar via Zenvia/Twilio
    console.log(`\n📲 [SIMULAÇÃO SMS] Para: ${phone} — Código: ${code}\n`);

    // Verificar se o cliente já existe neste tenant
    const cpfClean = cpf?.replace?.(/\D/g, '');
    const existingClient = cpfClean
      ? await prisma.client.findUnique({
        where: { tenantId_cpf: { tenantId: tenant.id, cpf: cpfClean } },
      })
      : null;

    return NextResponse.json({
      success: true,
      message: 'Código enviado com sucesso',
      isNewUser: !existingClient,
    });
  } catch (error) {
    console.error('[Request Code] Erro:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
