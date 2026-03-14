import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { toSlug } from '@/core/raffles/slug';
import { requireAdminAuth } from '@/app/api/admin/_shared/require-admin-auth';

const raffleSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  slug: z.string().optional(),
  title: z.string().min(3),
  description: z.string().optional().nullable(),
  bannerUrl: z.string().optional().nullable(),
  price: z.number().positive(),
  totalNumbers: z.number().int().positive(),
  minNumbers: z.number().int().positive().default(1),
  status: z.enum(['DRAFT', 'ACTIVE', 'FINISHED']).default('DRAFT'),
});

async function buildUniqueRaffleSlug(tenantId: string, title: string, ignoreRaffleId?: string): Promise<string> {
  const base = toSlug(title);
  let candidate = base;
  let suffix = 1;

  while (true) {
    const existing = await prisma.raffle.findFirst({
      where: {
        tenantId,
        slug: candidate,
        ...(ignoreRaffleId ? { id: { not: ignoreRaffleId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminAuth(req);
    if ('response' in auth) {
      return auth.response;
    }

    const body = await req.json();
    const parsed = raffleSchema.parse(body);

    if (parsed.tenantId !== auth.tenant.id) {
      return NextResponse.json({ error: 'Acesso negado para este tenant' }, { status: 403 });
    }

    const generatedSlug = parsed.slug?.trim() || await buildUniqueRaffleSlug(parsed.tenantId, parsed.title);

    const raffle = await prisma.raffle.create({
      data: {
        tenantId: parsed.tenantId,
        slug: generatedSlug,
        title: parsed.title,
        description: parsed.description || '',
        bannerUrl: parsed.bannerUrl || null,
        price: parsed.price,
        totalNumbers: parsed.totalNumbers,
        minNumbers: parsed.minNumbers,
        status: parsed.status,
      },
    });

    return NextResponse.json({ success: true, raffle });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao criar rifa' }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdminAuth(req);
    if ('response' in auth) {
      return auth.response;
    }

    const body = await req.json();
    const parsed = raffleSchema.parse(body);

    if (parsed.tenantId !== auth.tenant.id) {
      return NextResponse.json({ error: 'Acesso negado para este tenant' }, { status: 403 });
    }

    if (!parsed.id) {
      return NextResponse.json({ error: 'ID da rifa é obrigatório' }, { status: 400 });
    }

    const generatedSlug = parsed.slug?.trim() || await buildUniqueRaffleSlug(parsed.tenantId, parsed.title, parsed.id);

    const raffle = await prisma.raffle.update({
      where: { id: parsed.id },
      data: {
        slug: generatedSlug,
        title: parsed.title,
        description: parsed.description || '',
        bannerUrl: parsed.bannerUrl || null,
        price: parsed.price,
        totalNumbers: parsed.totalNumbers,
        minNumbers: parsed.minNumbers,
        status: parsed.status,
      },
    });

    return NextResponse.json({ success: true, raffle });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao editar rifa' }, { status: 400 });
  }
}
