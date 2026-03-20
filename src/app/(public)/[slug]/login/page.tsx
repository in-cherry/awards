import { redirect } from "next/navigation";
import { getClientAuthUser } from "@/lib/auth/mddleware";
import { prisma } from "@/lib/database/prisma";
import { ClientLoginView } from "./login-client";

type Params = Promise<{ slug: string }>;

export default async function ClientLoginPage(props: { params: Params }) {
  const { slug } = await props.params;
  const auth = await getClientAuthUser();

  if (auth) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.tenantId },
      select: { slug: true },
    });

    if (tenant?.slug === slug) {
      redirect(`/${slug}/profile`);
    }
  }

  return <ClientLoginView slug={slug} />;
}
