import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  const full = await prisma.tenant.findUnique({ where: { slug: 'tr-gustavin-1' }, select: { id: true } });
  const currentCanonical = await prisma.tenant.findUnique({ where: { slug: 'tr-gustavin' }, select: { id: true } });

  if (!full || !currentCanonical) {
    throw new Error('Tenants esperadas nao encontradas para consolidacao.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.tenant.update({
      where: { id: currentCanonical.id },
      data: {
        slug: 'tr-gustavin-legacy-partial',
        name: 'Tr Gustavin (partial)',
        isActive: false,
        customDomain: null,
      },
    });

    await tx.tenant.updateMany({
      where: { slug: { in: ['tr-gustavin-2', 'tr-gustavin-3'] } },
      data: {
        name: 'Tr Gustavin (partial)',
        isActive: false,
      },
    });

    await tx.tenant.update({
      where: { id: full.id },
      data: {
        slug: 'tr-gustavin',
        customDomain: 'www.trgustavin.com.br',
        name: 'Tr Gustavin',
        isActive: true,
      },
    });
  });

  console.log('Consolidacao de tenant concluida com sucesso.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
