import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    slug: string;
    id: string;
  }>;
}

export default async function RaffleDetailsPage({ params }: PageProps) {
  const { slug, id } = await params;

  // Buscar a rifa específica e verificar se pertence ao tenant correto
  const raffle = await prisma.raffle.findFirst({
    where: {
      id,
      tenant: {
        slug
      }
    },
    include: {
      tenant: true,
      winner: true,
      tickets: {
        include: {
          client: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      },
      mysteryPrizes: {
        include: {
          winners: {
            include: {
              client: true
            }
          }
        }
      },
      _count: {
        select: {
          tickets: true
        }
      }
    }
  });

  if (!raffle) {
    notFound();
  }

  const soldTickets = raffle._count.tickets;
  const remainingTickets = raffle.totalNumbers - soldTickets;
  const progressPercentage = (soldTickets / raffle.totalNumbers) * 100;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <Link href={`/${slug}`} className="hover:text-gray-900">
          Início
        </Link>
        <span>/</span>
        <Link href={`/${slug}/raffles`} className="hover:text-gray-900">
          Rifas
        </Link>
        <span>/</span>
        <span className="text-gray-900">{raffle.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Principal */}
        <div className="lg:col-span-2">
          {/* Header da Rifa */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            {raffle.bannerUrl && (
              <div className="aspect-video bg-gray-200">
                <img
                  src={raffle.bannerUrl}
                  alt={raffle.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${raffle.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800'
                  : raffle.status === 'FINISHED'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-yellow-100 text-yellow-800'
                  }`}>
                  {raffle.status === 'ACTIVE' ? 'Rifa Ativa' :
                    raffle.status === 'FINISHED' ? 'Rifa Finalizada' :
                      raffle.status === 'DRAFT' ? 'Rascunho' : 'Cancelada'}
                </span>

                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    R$ {raffle.price.toString()}
                  </div>
                  <div className="text-sm text-gray-600">por número</div>
                </div>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {raffle.title}
              </h1>

              {raffle.description && (
                <p className="text-gray-700 mb-6 whitespace-pre-wrap">
                  {raffle.description}
                </p>
              )}

              {/* Progresso da Rifa */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{soldTickets} vendidos</span>
                  <span>{remainingTickets} restantes</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <div className="text-center text-xs text-gray-500 mt-1">
                  {progressPercentage.toFixed(1)}% vendido
                </div>
              </div>

              {/* Informações da Rifa */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Total de números</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {raffle.totalNumbers.toLocaleString('pt-BR')}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Mínimo de números</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {raffle.minNumbers}
                  </div>
                </div>

                {raffle.drawDate && (
                  <div className="bg-gray-50 p-4 rounded-lg col-span-2">
                    <div className="text-sm text-gray-600">Data do sorteio</div>
                    <div className="text-xl font-semibold text-gray-900">
                      {new Date(raffle.drawDate).toLocaleString('pt-BR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Ganhador */}
              {raffle.winner && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    🏆 Ganhador da Rifa
                  </h3>
                  <p className="text-green-700">
                    <strong>{raffle.winner.name}</strong>
                  </p>
                  <p className="text-sm text-green-600">
                    CPF: {raffle.winner.cpf} | Telefone: {raffle.winner.phone}
                  </p>
                </div>
              )}

              {/* Botão de Participar */}
              {raffle.status === 'ACTIVE' && !raffle.winner && (
                <div className="text-center">
                  <Link
                    href={`/${slug}/checkout?raffle=${raffle.id}`}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors inline-block"
                  >
                    Participar Agora
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Prêmios Misteriosos */}
          {raffle.mysteryPrizes.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                🎁 Prêmios Misteriosos
              </h2>
              <div className="grid gap-4">
                {raffle.mysteryPrizes.map((prize) => (
                  <div key={prize.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{prize.title}</h3>
                      <span className="text-sm text-gray-500">
                        {prize.remaining}/{prize.totalAmount} restantes
                      </span>
                    </div>
                    {prize.description && (
                      <p className="text-gray-600 text-sm mb-3">{prize.description}</p>
                    )}

                    {/* Ganhadores do Prêmio */}
                    {prize.winners.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Ganhadores:</h4>
                        <div className="space-y-1">
                          {prize.winners.map((winner) => (
                            <div key={winner.id} className="text-sm text-gray-600">
                              🎉 {winner.client.name} - Número: {winner.ticketNumber}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Últimos Participantes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Últimos Participantes
            </h2>

            {raffle.tickets.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Nenhum participante ainda
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {raffle.tickets.slice(0, 20).map((ticket) => (
                  <div key={ticket.id} className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-b-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-medium text-sm">
                        {ticket.client.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {ticket.client.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Número: {ticket.number}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}