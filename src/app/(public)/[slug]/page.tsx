import { Footer } from "@/components/tenant/footer";
import { Header } from "@/components/tenant/header";
import { NoRaffle } from "@/components/tenant/no-raffle";
import prisma from "@/lib/database/prisma";
import { notFound, permanentRedirect } from "next/navigation";
import { AppContextProvider } from "@/contexts";
import { Raffle } from "@/components/tenant/raffle";
import { headers } from "next/headers";

interface TenantProps {
  params: Promise<{ slug: string }>
}

export default async function Tenant({ params }: TenantProps) {
  const { slug } = await params;
  const headersList = await headers();
  const hostHeader = headersList.get("host") ?? "";
  const protocolHeader = headersList.get("x-forwarded-proto");

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      owner: {
        select: {
          name: true,
          profile: {
            select: {
              avatar: true,
            },
          },
        }
      },
      raffles: {
        where: {
          status: "ACTIVE",
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      }
    },
  });

  if (!tenant) {
    notFound();
  }

  const currentHostWithoutPort = hostHeader.split(":")[0].toLowerCase();
  const currentPort = hostHeader.includes(":") ? hostHeader.split(":")[1] : "";

  const appHostname = (() => {
    try {
      if (!process.env.NEXT_PUBLIC_APP_URL) return null;
      return new URL(process.env.NEXT_PUBLIC_APP_URL).hostname.toLowerCase();
    } catch {
      return null;
    }
  })();

  const platformRootDomain = (process.env.APP_ROOT_DOMAIN || appHostname || "localhost").toLowerCase();
  const customDomain =
    "customDomain" in tenant && typeof tenant.customDomain === "string"
      ? tenant.customDomain
      : null;

  const targetHostWithoutPort = customDomain
    ? customDomain.toLowerCase()
    : `${tenant.slug}.${platformRootDomain}`;

  const protocol = protocolHeader || (currentHostWithoutPort.includes("localhost") ? "http" : "https");

  const targetHost =
    currentPort && targetHostWithoutPort.includes("localhost")
      ? `${targetHostWithoutPort}:${currentPort}`
      : targetHostWithoutPort;

  const isCanonicalHost = currentHostWithoutPort === targetHostWithoutPort;

  if (!isCanonicalHost) {
    permanentRedirect(`${protocol}://${targetHost}`);
  }

  const activeRaffle = tenant.raffles[0] ?? null;
  const tenantData = {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    logoUrl: tenant.logo,
    instagramUrl: tenant.instagram,
    telegramUrl: tenant.telegram,
    supportUrl: tenant.supportUrl,
    isActive: true,
    owner: {
      name: tenant.owner.name,
      avatarUrl: tenant.owner.profile?.avatar || null,
    }
  };

  const raffleData = activeRaffle ? {
    id: activeRaffle.id,
    title: activeRaffle.name,
    slug: activeRaffle.slug,
    description: activeRaffle.description,
    bannerUrl: activeRaffle.banner,
    price: Number(activeRaffle.priceTicket),
    minNumbers: activeRaffle.minTickets,
    totalNumbers: activeRaffle.maxTickets,
    status: (activeRaffle.status === "CANCELED" ? "CANCELLED" : activeRaffle.status) as "DRAFT" | "ACTIVE" | "FINISHED" | "CANCELLED",
    drawDate: activeRaffle.drawDate,
    nextTicketNumber: 1,
    mysteryBoxEnabled: false,
    mysteryBoxConfig: null,
    winnerId: null,
    pixText: activeRaffle.pixValue.toString(),
    mysteryPrizes: []
  } : null;

  return (
    <AppContextProvider tenant={tenantData} raffle={raffleData || undefined}>
      <div className="flex min-h-screen flex-col">
        <Header />

        <main className={activeRaffle ? "flex-1" : "flex flex-1 items-start justify-center px-4 pt-4 md:items-center md:pt-0"}>
          {activeRaffle ? <Raffle /> : <NoRaffle />}
        </main>

        <Footer />
      </div>
    </AppContextProvider>
  );
}