import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/database/prisma";
import { getAuthUser } from "@/lib/auth/mddleware";
import { getActiveTenantCookieName } from "@/lib/auth/jwt";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function getActiveTenant(userId: string) {
  const cookieStore = await cookies();
  const activeTenantSlug = cookieStore.get(getActiveTenantCookieName())?.value;

  if (!activeTenantSlug) return null;

  return prisma.tenant.findFirst({
    where: {
      slug: activeTenantSlug,
      OR: [
        { ownerId: userId },
        {
          members: {
            some: {
              userId,
              revokedAt: null,
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      connections: {
        where: {
          provider: "MERCADO_PAGO",
          status: "ACTIVE",
        },
        select: { id: true },
        take: 1,
      },
    },
  });
}

export async function GET() {
  const authUser = await getAuthUser();

  if (!authUser) {
    return NextResponse.json({ success: false, error: "Nao autenticado." }, { status: 401 });
  }

  const tenant = await getActiveTenant(authUser.userId);

  if (!tenant) {
    return NextResponse.json({ success: false, error: "Organizacao ativa nao encontrada." }, { status: 404 });
  }

  const raffles = await prisma.raffle.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      banner: true,
      pixValue: true,
      priceTicket: true,
      minTickets: true,
      maxTickets: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    success: true,
    mercadoPagoConnected: tenant.connections.length > 0,
    tenant: {
      name: tenant.name,
      slug: tenant.slug,
    },
    raffles: raffles.map((raffle) => ({
      ...raffle,
      pixValue: Number(raffle.pixValue),
      priceTicket: Number(raffle.priceTicket),
    })),
  });
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();

  if (!authUser) {
    return NextResponse.json({ success: false, error: "Nao autenticado." }, { status: 401 });
  }

  const tenant = await getActiveTenant(authUser.userId);

  if (!tenant) {
    return NextResponse.json({ success: false, error: "Organizacao ativa nao encontrada." }, { status: 404 });
  }

  if (tenant.connections.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: "Conecte o Mercado Pago da organizacao antes de criar uma rifa.",
      },
      { status: 403 },
    );
  }

  const payload = await request.json();
  const name = String(payload?.name ?? "").trim();
  const description = payload?.description ? String(payload.description).trim() : null;
  const banner = payload?.banner ? String(payload.banner).trim() : null;
  const pixValue = Number(payload?.pixValue ?? 0);
  const priceTicket = Number(payload?.priceTicket ?? 0);
  const minTickets = Number(payload?.minTickets ?? 100);
  const maxTickets = Number(payload?.maxTickets ?? 1_000_000);
  const mysteryPrizesRaw = Array.isArray(payload?.mysteryPrizes) ? payload.mysteryPrizes : [];
  const mysteryPrizes: Array<{ name: string; value: number; description: string | null }> = mysteryPrizesRaw
    .map((item: unknown) => {
      const entry = item as { name?: unknown; value?: unknown; description?: unknown };
      const prizeName = String(entry?.name ?? "").trim();
      const prizeValue = Number(entry?.value ?? 0);
      const prizeDescription = entry?.description ? String(entry.description).trim() : null;

      return {
        name: prizeName,
        value: prizeValue,
        description: prizeDescription,
      };
    })
    .filter(
      (item: { name: string; value: number; description: string | null }) =>
        item.name.length > 0 && Number.isFinite(item.value) && item.value > 0,
    );

  if (!name) {
    return NextResponse.json({ success: false, error: "Informe o nome da rifa." }, { status: 400 });
  }

  if (priceTicket <= 0) {
    return NextResponse.json({ success: false, error: "Informe um valor de ticket valido." }, { status: 400 });
  }

  if (minTickets < 1 || maxTickets < minTickets) {
    return NextResponse.json({ success: false, error: "Faixa de tickets invalida." }, { status: 400 });
  }

  const baseSlug = slugify(payload?.slug ? String(payload.slug) : name);

  if (!baseSlug) {
    return NextResponse.json({ success: false, error: "Slug invalido." }, { status: 400 });
  }

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const exists = await prisma.raffle.findUnique({
      where: { tenantId_slug: { tenantId: tenant.id, slug } },
      select: { id: true },
    });
    if (!exists) break;
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }

  const raffle = await prisma.raffle.create({
    data: {
      tenantId: tenant.id,
      name,
      slug,
      description,
      banner,
      pixValue,
      priceTicket,
      minTickets,
      maxTickets,
      status: "ACTIVE",
      mysteryPrizes: mysteryPrizes.length
        ? {
          create: mysteryPrizes.map((prize) => ({
            name: prize.name,
            description: prize.description,
            value: prize.value,
            totalAmount: 1,
            remaining: 1,
          })),
        }
        : undefined,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      status: true,
    },
  });

  return NextResponse.json({ success: true, raffle }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const authUser = await getAuthUser();

  if (!authUser) {
    return NextResponse.json({ success: false, error: "Nao autenticado." }, { status: 401 });
  }

  const tenant = await getActiveTenant(authUser.userId);

  if (!tenant) {
    return NextResponse.json({ success: false, error: "Organizacao ativa nao encontrada." }, { status: 404 });
  }

  const raffleId = String(request.nextUrl.searchParams.get("raffleId") || "").trim();

  if (!raffleId) {
    return NextResponse.json({ success: false, error: "raffleId e obrigatorio." }, { status: 400 });
  }

  const raffle = await prisma.raffle.findFirst({
    where: {
      id: raffleId,
      tenantId: tenant.id,
    },
    select: {
      id: true,
      name: true,
      tickets: {
        select: { id: true },
        take: 1,
      },
      awards: {
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!raffle) {
    return NextResponse.json({ success: false, error: "Rifa nao encontrada." }, { status: 404 });
  }

  if (raffle.tickets.length > 0 || raffle.awards.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: "Esta rifa possui bilhetes/premios vinculados e nao pode ser removida.",
      },
      { status: 409 },
    );
  }

  await prisma.raffle.delete({
    where: { id: raffle.id },
  });

  return NextResponse.json({
    success: true,
    deleted: {
      id: raffle.id,
      name: raffle.name,
    },
  });
}
