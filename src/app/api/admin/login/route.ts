import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    const { email, password, tenantSlug } = await request.json();

    if (!email || !password || !tenantSlug) {
      return NextResponse.json(
        { success: false, error: 'Email, senha e tenant são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar o tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      include: { owner: true }
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o usuário é o dono do tenant ou admin
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 401 }
      );
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: 'Senha incorreta' },
        { status: 401 }
      );
    }

    // Verificar se é admin ou dono do tenant
    if (user.role !== 'ADMIN' && user.id !== tenant.ownerId) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Erro no login admin:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}