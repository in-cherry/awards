import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function cleanupTenant(tenantId: string, slug: string) {
  await prisma.$transaction(async (tx) => {
    await tx.mysteryPrizeWinner.deleteMany({
      where: {
        OR: [
          { payment: { tenantId } },
          { prize: { raffle: { tenantId } } },
        ],
      },
    });

    await tx.ticket.deleteMany({ where: { raffle: { tenantId } } });
    await tx.payment.deleteMany({ where: { tenantId } });
    await tx.mysteryPrize.deleteMany({ where: { raffle: { tenantId } } });
    await tx.raffle.deleteMany({ where: { tenantId } });
    await tx.verificationCode.deleteMany({ where: { tenantId } });
    await tx.client.deleteMany({ where: { tenantId } });
    await tx.tenant.delete({ where: { id: tenantId } });
  });

  console.log(`[cleanup] tenant removida: ${slug}`);
}

async function main() {
  const canonicalSlug = process.argv[2] ?? 'tr-gustavin';
  const prefix = process.argv[3] ?? 'tr-gustavin';

  const canonical = await prisma.tenant.findUnique({
    where: { slug: canonicalSlug },
    select: { id: true, slug: true },
  });

  if (!canonical) {
    throw new Error(`Tenant canonica nao encontrada: ${canonicalSlug}`);
  }

  const candidates = await prisma.tenant.findMany({
    where: {
      slug: { startsWith: prefix },
      id: { not: canonical.id },
    },
    select: { id: true, slug: true },
  });

  if (candidates.length === 0) {
    console.log('[cleanup] nenhuma tenant parcial encontrada.');
    return;
  }

  console.log(`[cleanup] removendo ${candidates.length} tenant(s) parcial(is)...`);
  for (const tenant of candidates) {
    await cleanupTenant(tenant.id, tenant.slug);
  }

  console.log('[cleanup] finalizado com sucesso.');
}

main()
  .catch((error) => {
    console.error('[cleanup] erro:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
