// Este arquivo contém dados MOCK que foram substituídos por dados reais do banco
// Mantido apenas para referência histórica

// Os dados agora vêm diretamente do banco de dados através do Prisma
// Ver: src/prisma/seed.ts para dados de exemplo
// Ver: src/app/[slug]/page.tsx para busca de dados reais,
value: 300.00
  },
mysteryBox: {
  enabled: true,
    rules: [
      { minTickets: 400, boxes: 1 },
      { minTickets: 600, boxes: 2 },
      { minTickets: 1200, boxes: 6 }
    ],
      winProbability: 0.1,
        prizes: [
          { id: 1, name: 'R$ 500,00 no PIX', winnerOrderNumber: '240220-001', probability: null },
          { id: 2, name: 'iPhone 15 Pro', winnerOrderNumber: '240222-003', probability: null },
          { id: 3, name: 'R$ 1.000,00 no PIX', winnerOrderNumber: null, probability: null },
          { id: 4, name: 'PlayStation 5', winnerOrderNumber: null, probability: null }
        ]
}
};

export const MOCK_CONTRIBUTORS: Contributor[] = [
  { rank: 1, name: 'Murilo Oliveira Souza', ticketCount: 5000, color: 'bg-yellow-500', category: 'geral' },
  { rank: 2, name: 'Vagner Alberto Monteiro', ticketCount: 3000, color: 'bg-slate-300', category: 'geral' },
  { rank: 3, name: 'Jeniffer Pereira Martins', ticketCount: 1000, color: 'bg-orange-400', category: 'geral' },
  { rank: 4, name: 'Carlos Eduardo', ticketCount: 800, color: 'bg-white/5', category: 'geral' },
  { rank: 5, name: 'Ana Paula', ticketCount: 750, color: 'bg-white/5', category: 'geral' },
  { rank: 6, name: 'Ricardo Silva', ticketCount: 600, color: 'bg-white/5', category: 'geral' },
  { rank: 7, name: 'Beatriz Santos', ticketCount: 550, color: 'bg-white/5', category: 'geral' },
  { rank: 8, name: 'Felipe Amorim', ticketCount: 400, color: 'bg-white/5', category: 'geral' },
  { rank: 9, name: 'Juliana Lima', ticketCount: 350, color: 'bg-white/5', category: 'geral' },
  { rank: 10, name: 'Marcos Oliveira', ticketCount: 300, color: 'bg-white/5', category: 'geral' },

  // Daily
  { rank: 1, name: 'Murilo Oliveira Souza', ticketCount: 500, color: 'bg-yellow-500', category: 'diaria' },
  { rank: 2, name: 'Ana Paula', ticketCount: 300, color: 'bg-slate-300', category: 'diaria' },
  { rank: 3, name: 'Ricardo Silva', ticketCount: 200, color: 'bg-orange-400', category: 'diaria' },

  // Weekly
  { rank: 1, name: 'Vagner Alberto Monteiro', ticketCount: 1500, color: 'bg-yellow-500', category: 'semanal' },
  { rank: 2, name: 'Murilo Oliveira Souza', ticketCount: 1200, color: 'bg-slate-300', category: 'semanal' },
  { rank: 3, name: 'Jeniffer Pereira Martins', ticketCount: 800, color: 'bg-orange-400', category: 'semanal' },

  // Monthly
  { rank: 1, name: 'Murilo Oliveira Souza', ticketCount: 4000, color: 'bg-yellow-500', category: 'mensal' },
  { rank: 2, name: 'Vagner Alberto Monteiro', ticketCount: 2500, color: 'bg-slate-300', category: 'mensal' },
  { rank: 3, name: 'Jeniffer Pereira Martins', ticketCount: 900, color: 'bg-orange-400', category: 'mensal' },
];

export const MOCK_TICKETS: Ticket[] = [
  { orderNumber: '240220-001', name: 'Murilo Oliveira Souza', phone: '11987654321', cpf: '07163165102', numbers: Array.from({ length: 400 }, (_, i) => (10000 + i).toString()), date: '2024-02-20 14:30:45', status: 'pago', raffleTitle: 'TITAN 160 (10 mil no PIX)', openedBoxes: [{ index: 0, id: 1, prize: 'R$ 500,00 no PIX' }] },
  { orderNumber: '240221-002', name: 'Vagner Alberto Monteiro', phone: '11912345678', cpf: '98765432100', numbers: ['55443', '22110'], date: '2024-02-21 09:15:22', status: 'pago', raffleTitle: 'TITAN 160 (10 mil no PIX)', openedBoxes: [] },
  { orderNumber: '240222-003', name: 'Murilo Oliveira Souza', phone: '11987654321', cpf: '07163165102', numbers: Array.from({ length: 1200 }, (_, i) => (20000 + i).toString()), date: '2024-02-22 18:45:10', status: 'pago', raffleTitle: 'TITAN 160 (10 mil no PIX)', openedBoxes: [{ index: 0, id: 2, prize: 'iPhone 15 Pro' }, { index: 1, id: 3, prize: null }] }
];