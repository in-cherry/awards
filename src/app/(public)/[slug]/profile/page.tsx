import { redirect } from "next/navigation";
import { getClientAuthUser } from "@/lib/auth/mddleware";
import { prisma } from "@/lib/database/prisma";
import { ClientProfileView } from "./profile-client";

type Params = Promise<{ slug: string }>;

export default async function ClientProfilePage(props: { params: Params }) {
  const { slug } = await props.params;
  const auth = await getClientAuthUser();

  if (!auth) {
    redirect(`/${slug}/login`);
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: auth.tenantId },
    select: { slug: true },
  });

  if (tenant?.slug !== slug) {
    redirect(`/${slug}/login`);
  }

  return <ClientProfileView slug={slug} />;
}
raffle: {
