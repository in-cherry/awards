import "dotenv/config";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

async function main() {
  console.log("Seeding database...");

  // Limpar dados existentes (opcional, apenas para desenvolvimento)
  await prisma.mysteryPrizeWinner.deleteMany();
  await prisma.mysteryPrize.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.client.deleteMany();
  await prisma.raffle.deleteMany();
  await prisma.verificationCode.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.user.deleteMany();

  // 1. Criar usuário admin
  const hashedPassword = await bcrypt.hash("admin123", SALT_ROUNDS);
  const admin = await prisma.user.create({
    data: {
      email: "admin@trgustavin.com",
      password: hashedPassword,
      name: "Administrador TRGustavin",
      cpf: "12345678909",
      phone: "11999999999",
      role: "ADMIN"
    }
  });

  // 2. Criar tenant (empresa)
  const tenant = await prisma.tenant.create({
    data: {
      name: "TRGustavin",
      slug: "trgustav",
      logoUrl: "https://www.trgustavin.com.br/logo.png",
      isActive: true,
      owner: {
        connect: {
          id: admin.id
        }
      }
    }
  });

  // 3. Criar rifa ativa
  const raffle = await prisma.raffle.create({
    data: {
      slug: "titan-160-10-mil-no-pix",
      title: "TITAN 160 (10 mil no PIX)",
      description: "O vencedor será definido no primeiro prêmio da loteria federal!",
      bannerUrl: "https://www.trgustavin.com.br/play/views/theme/trgustavin/assets/img/acao/titan.png",
      price: 0.05,
      minNumbers: 100,
      totalNumbers: 1000000,
      status: "ACTIVE",
      drawDate: new Date("2026-04-30T20:00:00.000Z"),
      nextTicketNumber: 1,
      mysteryBoxEnabled: true,
      mysteryBoxConfig: {
        rules: [
          { minTickets: 400, boxes: 1 },
          { minTickets: 600, boxes: 2 },
          { minTickets: 1200, boxes: 6 }
        ],
        winProbability: 0.1
      },
      tenant: {
        connect: {
          id: tenant.id
        }
      }
    }
  });

  // 4. Criar prêmios da caixa misteriosa
  const mysteryPrize1 = await prisma.mysteryPrize.create({
    data: {
      title: "R$ 500,00 no PIX",
      description: "Prêmio em dinheiro via PIX",
      totalAmount: 10,
      remaining: 8,
      raffle: {
        connect: {
          id: raffle.id
        }
      }
    }
  });

  const mysteryPrize2 = await prisma.mysteryPrize.create({
    data: {
      title: "iPhone 15 Pro",
      description: "iPhone 15 Pro 128GB",
      totalAmount: 3,
      remaining: 2,
      raffle: {
        connect: {
          id: raffle.id
        }
      }
    }
  });

  const mysteryPrize3 = await prisma.mysteryPrize.create({
    data: {
      title: "R$ 1.000,00 no PIX",
      description: "Prêmio em dinheiro via PIX",
      totalAmount: 5,
      remaining: 5,
      raffle: {
        connect: {
          id: raffle.id
        }
      }
    }
  });

  // 5. Criar clientes
  const client1 = await prisma.client.create({
    data: {
      name: "Murilo de Oliveira Souza",
      cpf: "07163165102",
      phone: "11987654321",
      email: "murilo@email.com",
      tenant: {
        connect: {
          id: tenant.id
        }
      }
    }
  });

  const client2 = await prisma.client.create({
    data: {
      name: "Vagner Alberto Monteiro",
      cpf: "98765432100",
      phone: "11912345678",
      email: "vagner@email.com",
      tenant: {
        connect: {
          id: tenant.id
        }
      }
    }
  });

  const client3 = await prisma.client.create({
    data: {
      name: "Jeniffer Pereira Martins",
      cpf: "45678912364",
      phone: "11923456789",
      email: "jeniffer@email.com",
      tenant: {
        connect: {
          id: tenant.id
        }
      }
    }
  });

  // 6. Criar pagamentos e tickets
  const payment1 = await prisma.payment.create({
    data: {
      externalId: "MP001-240220",
      status: "APPROVED",
      amount: 20.00, // 400 tickets x 0.05
      ticketCount: 400,
      boxesGranted: 1,
      tenant: { connect: { id: tenant.id } },
      raffle: { connect: { id: raffle.id } },
      client: { connect: { id: client1.id } }
    }
  });

  // Criar tickets para o client1 (400 tickets)
  const ticketsClient1 = [];
  for (let i = 1; i <= 400; i++) {
    ticketsClient1.push({
      number: i,
      numberFormatted: String(i).padStart(6, '0'),
      raffleId: raffle.id,
      clientId: client1.id,
      paymentId: payment1.id
    });
  }
  await prisma.ticket.createMany({
    data: ticketsClient1
  });

  const payment2 = await prisma.payment.create({
    data: {
      externalId: "MP002-240221",
      status: "APPROVED",
      amount: 150.00, // 3000 tickets x 0.05
      ticketCount: 3000,
      boxesGranted: 6,
      tenant: { connect: { id: tenant.id } },
      raffle: { connect: { id: raffle.id } },
      client: { connect: { id: client2.id } }
    }
  });

  // Criar tickets para o client2 (3000 tickets)
  const ticketsClient2 = [];
  for (let i = 401; i <= 3400; i++) {
    ticketsClient2.push({
      number: i,
      numberFormatted: String(i).padStart(6, '0'),
      raffleId: raffle.id,
      clientId: client2.id,
      paymentId: payment2.id
    });
  }
  await prisma.ticket.createMany({
    data: ticketsClient2
  });

  const payment3 = await prisma.payment.create({
    data: {
      externalId: "MP003-240222",
      status: "APPROVED",
      amount: 50.00, // 1000 tickets x 0.05
      ticketCount: 1000,
      boxesGranted: 2,
      tenant: { connect: { id: tenant.id } },
      raffle: { connect: { id: raffle.id } },
      client: { connect: { id: client3.id } }
    }
  });

  // Criar tickets para o client3 (1000 tickets)
  const ticketsClient3 = [];
  for (let i = 3401; i <= 4400; i++) {
    ticketsClient3.push({
      number: i,
      numberFormatted: String(i).padStart(6, '0'),
      raffleId: raffle.id,
      clientId: client3.id,
      paymentId: payment3.id
    });
  }
  await prisma.ticket.createMany({
    data: ticketsClient3
  });

  // 7. Criar alguns ganhadores de caixa misteriosa
  await prisma.mysteryPrizeWinner.create({
    data: {
      prize: { connect: { id: mysteryPrize1.id } },
      client: { connect: { id: client1.id } },
      payment: { connect: { id: payment1.id } },
      boxIndex: 0,
      ticketNumber: 200
    }
  });

  await prisma.mysteryPrizeWinner.create({
    data: {
      prize: { connect: { id: mysteryPrize2.id } },
      client: { connect: { id: client2.id } },
      payment: { connect: { id: payment2.id } },
      boxIndex: 0,
      ticketNumber: 1500
    }
  });

  // 8. Atualizar nextTicketNumber da rifa
  await prisma.raffle.update({
    where: { id: raffle.id },
    data: { nextTicketNumber: 4401 }
  });

  console.log("Database seeded successfully!");
  console.log(`Created:
  - Admin user: admin@trgustavin.com / admin123
  - Tenant: ${tenant.name} (${tenant.slug})
  - Raffle: ${raffle.title}
  - 3 Clients with total 4400 tickets
  - 3 Mystery prizes
  - 2 Mystery prize winners`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });