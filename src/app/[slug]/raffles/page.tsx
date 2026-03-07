import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    slug: string
  }>;
}

export default async function RafflesPage({ params }: PageProps) {
  const { slug } = await params;

  // Buscar o tenant pelo slug
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      raffles: {
        where: {
          status: {
            in: ['ACTIVE', 'FINISHED']
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  if (!tenant) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Rifas - {tenant.name}
        </h1>
        <p className="text-gray-600">
          Confira todas as rifas disponíveis
        </p>
      </div>

      {tenant.raffles.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-lg p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma rifa encontrada
            </h3>
            <p className="text-gray-600">
              Não há rifas ativas ou finalizadas no momento.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenant.raffles.map((raffle) => (
            <Link
              key={raffle.id}
              href={`/${slug}/raffles/${raffle.id}`}
              className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
            >
              {raffle.bannerUrl && (
                <div className="aspect-video bg-gray-200">
                  <img
                    src={raffle.bannerUrl}
                    alt={raffle.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${raffle.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800'
                    : raffle.status === 'FINISHED'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {raffle.status === 'ACTIVE' ? 'Ativa' :
                      raffle.status === 'FINISHED' ? 'Finalizada' :
                        raffle.status === 'DRAFT' ? 'Rascunho' : 'Cancelada'}
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    R$ {raffle.price.toString()}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {raffle.title}
                </h3>

                {raffle.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {raffle.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{raffle.totalNumbers} números</span>
                  {raffle.drawDate && (
                    <span>
                      Sorteio: {new Date(raffle.drawDate).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}