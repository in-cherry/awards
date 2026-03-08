import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const raffleSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  title: z.string().min(3),
  description: z.string().optional().nullable(),
  bannerUrl: z.string().optional().nullable(),
  price: z.number().positive(),
  totalNumbers: z.number().int().positive(),
  minNumbers: z.number().int().positive().default(1),
  status: z.enum(['DRAFT', 'ACTIVE', 'FINISHED']).default('DRAFT'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = raffleSchema.parse(body);

    const raffle = await prisma.raffle.create({
      data: {
        tenantId: parsed.tenantId,
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

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const parsed = raffleSchema.parse(body);

    if (!parsed.id) {
      return NextResponse.json({ error: 'ID da rifa é obrigatório' }, { status: 400 });
    }

    const raffle = await prisma.raffle.update({
      where: { id: parsed.id },
      data: {
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
